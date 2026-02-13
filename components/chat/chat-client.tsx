"use client";

import { ChevronDown, Send, Loader2, Sparkles } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

import { Message } from "@/components/chat/Message";
import { Button } from "@/components/ui/button";

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
  const hasMessages = (active?.messages.length ?? 0) > 0;

  useEffect(() => {
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
    localStorage.setItem(STORAGE_CONV, JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    if (activeId) localStorage.setItem(STORAGE_ACTIVE, activeId);
  }, [activeId]);

  useEffect(() => {
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
    let currentActiveId = activeId;

    if (!currentActiveId) {
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
      currentActiveId = id;
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
        if (c.id !== currentActiveId) return c;
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
      const currentConv = conversations.find((c) => c.id === currentActiveId);

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          model,
          stream: true,
          messages: [
            ...(currentConv?.messages ?? []).map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content: text },
          ],
        }),
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
                  if (c.id !== currentActiveId) return c;
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
                  if (c.id !== currentActiveId) return c;
                  return { ...c, tokens: localPrompt + localCompletion, costUsd: cost, updatedAt: Date.now() };
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

  const tokenTotal = promptTokens + completionTokens;
  const costUsd = calcCost(model, promptTokens, completionTokens);

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      {/* Messages area */}
      <div ref={listRef} className="flex-1 overflow-auto">
        <div className="mx-auto w-full max-w-2xl px-4 py-8">
          {!hasMessages ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Image
                src="/logo.svg"
                alt="dogecat"
                width={80}
                height={80}
                className="mb-6 opacity-80"
              />
              <h1 className="mb-2 text-2xl font-semibold text-slate-900">dogecat</h1>
              <p className="text-sm text-slate-500">Decentralized AI inference</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {active?.messages.map((m) => (
                <Message key={m.id} role={m.role} content={m.content} />
              ))}

              {typing && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Thinking...</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Input area */}
      <div className="border-t border-slate-200 bg-white px-4 py-4">
        <div className="mx-auto w-full max-w-2xl">
          <div className="relative">
            <textarea
              ref={textareaRef}
              className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-24 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:outline-none"
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
            <Button
              size="sm"
              disabled={sending || !input.trim()}
              onClick={send}
              className="absolute bottom-2 right-2 h-8 rounded-xl bg-slate-900 px-3 text-white hover:bg-slate-800 disabled:opacity-40"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>

          <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <div className="relative">
                <select
                  className="h-6 appearance-none rounded border-0 bg-transparent pr-5 text-xs text-slate-500 focus:outline-none"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                >
                  {MODELS.map((m) => (
                    <option key={m} value={m}>
                      Qwen3-235B
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-0 top-1 h-3 w-3 text-slate-400" />
              </div>
            </div>
            {tokenTotal > 0 && (
              <span>
                {tokenTotal.toLocaleString()} tokens · {fmtUsd(costUsd)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
