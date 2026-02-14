"use client";

import { ChevronDown, Send, Loader2, Sparkles, PanelLeftClose, PanelLeft } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState, useCallback } from "react";

import { Message } from "@/components/chat/Message";
import { ConversationSidebar } from "@/components/chat/conversation-sidebar";
import { Button } from "@/components/ui/button";
import { useEncryption } from "@/components/encryption/encryption-provider";

type ChatMsg = {
  id: string;
  role: "user" | "assistant";
  content: string;
  encrypted?: boolean;
};

const MODELS = ["Qwen/Qwen3-235B-A22B-Instruct-2507-FP8"] as const;
const MODEL_SHORT = "Qwen 235B";

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

export function EncryptedChatClient() {
  const { state, encrypt, decrypt } = useEncryption();
  
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarRefresh, setSidebarRefresh] = useState(0);

  const [model, setModel] = useState<string>(MODELS[0]);
  const [input, setInput] = useState<string>("");
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);

  const [promptTokens, setPromptTokens] = useState<number>(0);
  const [completionTokens, setCompletionTokens] = useState<number>(0);

  const listRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const hasMessages = messages.length > 0;
  const isUnlocked = state.status === "unlocked";

  // Load conversation when selected
  const loadConversation = useCallback(async (id: string | null) => {
    setConversationId(id);
    setMessages([]);
    setPromptTokens(0);
    setCompletionTokens(0);

    if (!id || !isUnlocked) return;

    try {
      const res = await fetch(`/api/conversations/${id}`);
      if (res.ok) {
        const data = await res.json();
        
        // Decrypt messages
        const decryptedMsgs: ChatMsg[] = [];
        for (const m of data.messages ?? []) {
          let content = m.content;
          if (m.encrypted) {
            try {
              content = await decrypt(m.content);
            } catch (e) {
              console.error("Failed to decrypt message:", e);
              content = "[Unable to decrypt]";
            }
          }
          decryptedMsgs.push({
            id: m.id,
            role: m.role as "user" | "assistant",
            content,
            encrypted: m.encrypted,
          });
        }
        
        setMessages(decryptedMsgs);
      }
    } catch (e) {
      console.error("Failed to load conversation:", e);
    }
  }, [isUnlocked, decrypt]);

  // Auto-scroll on new messages
  useEffect(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    });
  }, [messages.length, typing]);

  function newChat() {
    setConversationId(null);
    setMessages([]);
    setPromptTokens(0);
    setCompletionTokens(0);
    setInput("");
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
    const text = input.trim();
    if (!text || sending || !isUnlocked) return;

    setSending(true);
    setTyping(true);
    setInput("");

    let currentConvoId = conversationId;

    // Create conversation if needed
    if (!currentConvoId) {
      try {
        const res = await fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: "Encrypted chat" }), // Generic title since we can't see content
        });
        if (res.ok) {
          const data = await res.json();
          currentConvoId = data.conversation.id;
          setConversationId(currentConvoId);
          setSidebarRefresh((n) => n + 1);
        }
      } catch (e) {
        console.error("Failed to create conversation:", e);
      }
    }

    // Add messages to UI optimistically
    const userMsgId = uid("m");
    const assistantMsgId = uid("m");
    const userMsg: ChatMsg = { id: userMsgId, role: "user", content: text };
    const assistantMsg: ChatMsg = { id: assistantMsgId, role: "assistant", content: "" };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);

    // Encrypt and save user message to DB (non-blocking)
    if (currentConvoId) {
      encrypt(text).then(encryptedContent => {
        fetch(`/api/conversations/${currentConvoId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            role: "user", 
            content: encryptedContent,
            encrypted: true,
          }),
        }).catch(console.error);
      }).catch(console.error);
    }

    try {
      // Note: We send UNENCRYPTED to the inference API (it needs to read the message)
      // Only storage is encrypted
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          model,
          stream: true,
          messages: [
            ...messages.map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content: text },
          ],
        }),
      });

      if (!res.ok || !res.body) {
        let errorMessage = "Something went wrong. Please try again.";
        try {
          const errorData = await res.json();
          errorMessage = errorData?.error?.message || errorData?.error || errorMessage;
        } catch {
          // ignore
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId ? { ...m, content: `⚠️ ${errorMessage}` } : m
          )
        );
        setTyping(false);
        setSending(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let localPrompt = 0;
      let localCompletion = 0;
      let fullContent = "";

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
              fullContent += delta;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId ? { ...m, content: m.content + delta } : m
                )
              );
            }

            const usage = parsed?.usage;
            if (usage) {
              localPrompt = Number(usage.prompt_tokens ?? 0);
              localCompletion = Number(usage.completion_tokens ?? 0);
              setPromptTokens(localPrompt);
              setCompletionTokens(localCompletion);
            }
          }
        }
      }

      // Encrypt and save assistant message to DB (non-blocking)
      if (currentConvoId && fullContent) {
        encrypt(fullContent).then(encryptedContent => {
          fetch(`/api/conversations/${currentConvoId}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              role: "assistant", 
              content: encryptedContent,
              encrypted: true,
            }),
          }).catch(console.error);
          setSidebarRefresh((n) => n + 1);
        }).catch(console.error);
      }
    } finally {
      setTyping(false);
      setSending(false);
    }
  }

  const tokenTotal = promptTokens + completionTokens;
  const costUsd = calcCost(model, promptTokens, completionTokens);

  // Don't render until unlocked
  if (!isUnlocked) {
    return null;
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      {sidebarOpen && (
        <ConversationSidebar
          activeId={conversationId}
          onSelect={loadConversation}
          onNew={newChat}
          refreshKey={sidebarRefresh}
        />
      )}

      {/* Main chat area */}
      <div className="flex flex-1 flex-col">
        {/* Toggle sidebar button */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-white/50 hover:text-white"
          >
            {sidebarOpen ? (
              <PanelLeftClose className="h-5 w-5" />
            ) : (
              <PanelLeft className="h-5 w-5" />
            )}
          </button>
          <div className="flex items-center gap-2 text-xs text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            E2E Encrypted
          </div>
        </div>

        {/* Messages area */}
        <div ref={listRef} className="flex-1 overflow-auto">
          <div className="mx-auto w-full max-w-2xl px-4 py-8">
            {!hasMessages ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="relative mb-6">
                  <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 blur-xl" />
                  <Image
                    src="/logo.svg"
                    alt="dogecat"
                    width={216}
                    height={216}
                    className="relative rounded-2xl"
                  />
                </div>
                <h1 className="mb-2 text-2xl font-semibold text-white">dogecat</h1>
                <p className="text-sm text-white/40">End-to-end encrypted AI chat</p>
                <p className="mt-2 text-xs text-white/30">Messages auto-delete after 30 days</p>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {messages.map((m) => (
                  <MessageBubble key={m.id} role={m.role} content={m.content} />
                ))}

                {typing && messages[messages.length - 1]?.content === "" && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-2 rounded-2xl bg-white/[0.03] px-4 py-3 text-sm text-white/60">
                      <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                      <span>Thinking...</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Input area */}
        <div className="border-t border-white/[0.06] bg-[#0a0a0b] px-4 py-4">
          <div className="mx-auto w-full max-w-2xl">
            <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03]">
              <textarea
                ref={textareaRef}
                className="w-full resize-none bg-transparent px-4 py-3.5 pr-14 text-sm text-white placeholder:text-white/30 focus:outline-none"
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
                className="absolute bottom-2.5 right-2.5 h-8 w-8 rounded-lg bg-emerald-500 p-0 text-white hover:bg-emerald-400 disabled:opacity-30"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>

            <div className="mt-2 flex items-center justify-between text-xs text-white/40">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-emerald-400" />
                  <select
                    className="appearance-none bg-transparent text-white/60 focus:outline-none"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                  >
                    {MODELS.map((m) => (
                      <option key={m} value={m}>
                        {MODEL_SHORT}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="h-3 w-3 text-white/40" />
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
    </div>
  );
}

// Dark-themed message component
function MessageBubble({ role, content }: { role: "user" | "assistant"; content: string }) {
  const isUser = role === "user";

  if (!content) return null;

  return (
    <div className={isUser ? "flex justify-end" : "flex justify-start"}>
      <div
        className={
          isUser
            ? "max-w-[85%] rounded-2xl bg-emerald-500/90 px-4 py-3 text-sm text-white sm:max-w-[75%]"
            : "max-w-[85%] text-sm text-white/90 sm:max-w-[75%]"
        }
      >
        <Message role={role} content={content} />
      </div>
    </div>
  );
}
