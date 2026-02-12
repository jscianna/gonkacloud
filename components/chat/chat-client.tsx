"use client";

import { ChevronDown, Menu, Plus, Send, Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Message } from "@/components/chat/Message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

type ChatMsg = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
};

type Conversation = {
  id: string;
  title: string;
  model: string;
  messages: ChatMsg[];
  costUsd: number;
  tokens: number;
  updatedAt: number;
};

const MODELS = ["Qwen/Qwen3-235B-A22B-Instruct-2507-FP8"] as const;

const PRICING: Record<string, { input: number; output: number }> = {
  "Qwen/Qwen3-235B-A22B-Instruct-2507-FP8": { input: 0.5, output: 1.0 },
};

function calcCost(model: string, prompt: number, completion: number) {
  const p = PRICING[model];
  if (!p) return 0;
  return (prompt * p.input) / 1_000_000 + (completion * p.output) / 1_000_000;
}

function fmtUsd(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 4 }).format(value);
}

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

const STORAGE_CONV = "dogecat_chat_conversations";
const STORAGE_ACTIVE = "dogecat_chat_active";
export function ChatClient({ initialBalanceUsd }: { initialBalanceUsd: string }) {
  const [loadingKey] = useState(false);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const [model, setModel] = useState<string>(MODELS[0]);
  const [input, setInput] = useState<string>("");
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);

  const [promptTokens, setPromptTokens] = useState<number>(0);
  const [completionTokens, setCompletionTokens] = useState<number>(0);

  const listRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const active = useMemo(() => conversations.find((c) => c.id === activeId) ?? null, [conversations, activeId]);

  useEffect(() => {
    // Load conversations.
    try {
      const raw = localStorage.getItem(STORAGE_CONV);
      const parsed = raw ? (JSON.parse(raw) as Conversation[]) : [];
      setConversations(Array.isArray(parsed) ? parsed : []);

      const storedActive = localStorage.getItem(STORAGE_ACTIVE);
      if (storedActive) {
        setActiveId(storedActive);
      } else if (parsed?.[0]?.id) {
        setActiveId(parsed[0].id);
      }
    } catch {
      setConversations([]);
    }
  }, []);

  useEffect(() => {
    // Persist conversations.
    localStorage.setItem(STORAGE_CONV, JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    if (activeId) localStorage.setItem(STORAGE_ACTIVE, activeId);
  }, [activeId]);

  useEffect(() => {
    // No API key is stored in the browser. Requests are authenticated via Clerk session cookies.
  }, []);

  useEffect(() => {
    // Scroll to bottom on message updates.
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    });
  }, [active?.messages.length, typing]);

  function newChat() {
    const id = uid("conv");
    const conv: Conversation = {
      id,
      title: "New chat",
      model,
      messages: [],
      costUsd: 0,
      tokens: 0,
      updatedAt: Date.now(),
    };

    setConversations((prev) => [conv, ...prev]);
    setActiveId(id);
    setPromptTokens(0);
    setCompletionTokens(0);
  }

  function updateTextareaHeight() {
    const el = textareaRef.current;
    if (!el) return;

    el.style.height = "0px";

    const lineHeight = 24;
    const maxHeight = lineHeight * 6;
    const next = Math.min(el.scrollHeight, maxHeight);
    el.style.height = `${next}px`;
  }

  async function send() {
    if (!activeId) {
      newChat();
      return;
    }

    const text = input.trim();
    if (!text || sending) return;

    setSending(true);
    setTyping(true);

    const userMsg: ChatMsg = { id: uid("m"), role: "user", content: text, createdAt: Date.now() };
    const assistantMsg: ChatMsg = { id: uid("m"), role: "assistant", content: "", createdAt: Date.now() };

    setInput("");

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== activeId) return c;
        const nextTitle = c.title === "New chat" ? text.slice(0, 40) : c.title;
        return {
          ...c,
          title: nextTitle,
          model,
          messages: [...c.messages, userMsg, assistantMsg],
          updatedAt: Date.now(),
        };
      })
    );

    try {
      const controller = new AbortController();

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model,
          stream: true,
          messages: [
            ...(active?.messages ?? []).map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content: text },
          ],
        }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        setTyping(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      let localPrompt = 0;
      let localCompletion = 0;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (!value) continue;

        buffer += decoder.decode(value, { stream: true });

        let split;
        while ((split = buffer.indexOf("\n\n")) !== -1) {
          const packet = buffer.slice(0, split);
          buffer = buffer.slice(split + 2);

          const lines = packet.split("\n");
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;

            const data = trimmed.slice(5).trim();
            if (data === "[DONE]") continue;

            let parsed: any;
            try {
              parsed = JSON.parse(data);
            } catch {
              continue;
            }

            const delta = parsed?.choices?.[0]?.delta?.content;
            if (typeof delta === "string" && delta.length > 0) {
              setConversations((prev) =>
                prev.map((c) => {
                  if (c.id !== activeId) return c;
                  return {
                    ...c,
                    messages: c.messages.map((m) => (m.id === assistantMsg.id ? { ...m, content: m.content + delta } : m)),
                    updatedAt: Date.now(),
                  };
                })
              );
            }

            const usage = parsed?.usage;
            if (usage) {
              localPrompt = Number(usage.prompt_tokens ?? 0);
              localCompletion = Number(usage.completion_tokens ?? 0);
              setPromptTokens(localPrompt);
              setCompletionTokens(localCompletion);

              const cost = calcCost(model, localPrompt, localCompletion);
              setConversations((prev) =>
                prev.map((c) => {
                  if (c.id !== activeId) return c;
                  return {
                    ...c,
                    tokens: localPrompt + localCompletion,
                    costUsd: cost,
                    updatedAt: Date.now(),
                  };
                })
              );
            }
          }
        }
      }
    } finally {
      setTyping(false);
      setSending(false);
    }
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <p className="text-sm font-semibold text-slate-900">Conversations</p>
        <Button size="sm" variant="outline" onClick={newChat}>
          <Plus className="mr-2 h-4 w-4" />
          New
        </Button>
      </div>
      <div className="flex-1 overflow-auto p-2">
        {conversations.length === 0 ? (
          <p className="px-3 py-2 text-sm text-slate-500">No chats yet.</p>
        ) : (
          <div className="space-y-1">
            {conversations
              .slice()
              .sort((a, b) => b.updatedAt - a.updatedAt)
              .map((c) => (
                <button
                  key={c.id}
                  className={
                    c.id === activeId
                      ? "w-full rounded-lg bg-slate-900 px-3 py-2 text-left text-sm font-medium text-white"
                      : "w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                  }
                  onClick={() => setActiveId(c.id)}
                >
                  <div className="truncate">{c.title || "Untitled"}</div>
                  <div className={c.id === activeId ? "mt-1 text-xs text-white/70" : "mt-1 text-xs text-slate-500"}>
                    {c.model}
                  </div>
                </button>
              ))}
          </div>
        )}
      </div>
      <div className="border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
        Balance: {initialBalanceUsd}
      </div>
    </div>
  );

  const tokenTotal = promptTokens + completionTokens;
  const costUsd = calcCost(model, promptTokens, completionTokens);

  return (
    <div className="flex h-[calc(100vh-4rem)] min-h-[600px] overflow-hidden rounded-xl border border-slate-200 bg-white">
      <aside className="hidden w-72 border-r border-slate-200 md:block">{sidebar}</aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button className="md:hidden" size="sm" variant="outline">
                  <Menu className="h-4 w-4" />
                  <span className="sr-only">Open conversations</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0">
                {sidebar}
              </SheetContent>
            </Sheet>

            <div className="relative">
              <select
                className="h-9 appearance-none rounded-md border border-slate-300 bg-white px-3 pr-9 text-sm font-medium text-slate-900"
                value={model}
                onChange={(e) => setModel(e.target.value)}
              >
                {MODELS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-2.5 h-4 w-4 text-slate-500" />
            </div>

            <Button size="sm" variant="outline" onClick={newChat}>
              <Plus className="mr-2 h-4 w-4" />
              New Chat
            </Button>
          </div>

          <div className="hidden items-center gap-3 rounded-full bg-slate-50 px-4 py-2 text-xs text-slate-600 sm:flex">
            <span>
              Tokens: <span className="font-semibold text-slate-900">{tokenTotal.toLocaleString()}</span>
            </span>
            <span>
              Cost: <span className="font-semibold text-slate-900">{fmtUsd(costUsd)}</span>
            </span>
          </div>
        </header>

        <div ref={listRef} className="flex-1 overflow-auto bg-slate-50 px-4 py-6">
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
            {!active ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
                Start a new chat to begin.
              </div>
            ) : (
              <>
                {active.messages.map((m) => (
                  <Message key={m.id} role={m.role} content={m.content} />
                ))}

                {typing ? (
                  <div className="flex justify-start">
                    <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-600">
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Thinking...
                      </span>
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>

        <div className="border-t border-slate-200 bg-white px-4 py-4">
          <div className="mx-auto flex w-full max-w-3xl items-end gap-3">
            <div className="flex-1">
              <textarea
                ref={textareaRef}
                className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
                placeholder="Message dogecat..."
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  requestAnimationFrame(updateTextareaHeight);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
                rows={1}
              />
              <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                <span>Shift+Enter for newline</span>
                <span className="sm:hidden">
                  Tokens: <span className="font-semibold text-slate-900">{tokenTotal.toLocaleString()}</span> | Cost:{" "}
                  <span className="font-semibold text-slate-900">{fmtUsd(costUsd)}</span>
                </span>
              </div>
            </div>

            <Button disabled={sending || loadingKey || !input.trim()} onClick={send}>
              <Send className="mr-2 h-4 w-4" />
              {sending ? "Sending..." : "Send"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
