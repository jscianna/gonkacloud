"use client";

import { Send, Loader2, ChevronDown, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Message } from "@/components/chat/Message";

type ChatMsg = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
};

const MODEL = "Qwen/Qwen3-235B-A22B-Instruct-2507-FP8";
const MODEL_SHORT = "Qwen 235B";

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

export function PublicChatClient() {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [tokenCount, setTokenCount] = useState(0);

  const listRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const hasMessages = messages.length > 0;

  useEffect(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    });
  }, [messages.length, typing]);

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
    if (!text || sending) return;

    setSending(true);
    setTyping(true);

    const userMsg: ChatMsg = { id: uid("m"), role: "user", content: text, createdAt: Date.now() };
    const assistantMsg: ChatMsg = { id: uid("m"), role: "assistant", content: "", createdAt: Date.now() };

    setInput("");
    setMessages((prev) => [...prev, userMsg, assistantMsg]);

    try {
      const res = await fetch("/api/chat/public", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          model: MODEL,
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
          prev.map((m) => m.id === assistantMsg.id ? { ...m, content: `⚠️ ${errorMessage}` } : m)
        );
        setTyping(false);
        setSending(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

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
              setMessages((prev) =>
                prev.map((m) => m.id === assistantMsg.id ? { ...m, content: m.content + delta } : m)
              );
            }

            const usage = parsed?.usage;
            if (usage) {
              const total = (usage.prompt_tokens ?? 0) + (usage.completion_tokens ?? 0);
              setTokenCount(total);
            }
          }
        }
      }
    } finally {
      setTyping(false);
      setSending(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0b]">
      {/* Header */}
      <header className="fixed top-0 z-50 flex w-full items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 text-xs font-medium text-white/70">
            <Sparkles className="h-3 w-3 text-emerald-400" />
            <span>{MODEL_SHORT}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link 
            href="/api-docs" 
            className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-sm font-medium text-white/80 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
          >
            API
          </Link>
          <Link 
            href="/sign-in" 
            className="rounded-full bg-emerald-500 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-emerald-400"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main ref={listRef} className="flex-1 overflow-auto pt-16">
        <div className="mx-auto w-full max-w-2xl px-4">
          {!hasMessages ? (
            <div className="flex min-h-[calc(100vh-180px)] flex-col items-center justify-center">
              {/* Logo */}
              <div className="relative mb-6">
                <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 blur-xl" />
                <Image
                  src="/logo.svg"
                  alt="dogecat"
                  width={72}
                  height={72}
                  className="relative rounded-2xl"
                />
              </div>
              
              {/* Brand name */}
              <h1 className="mb-2 text-2xl font-semibold tracking-tight text-white">
                dogecat
              </h1>
              
              {/* Tagline */}
              <p className="mb-8 text-sm text-white/40">
                Decentralized AI inference
              </p>

              {/* Example prompts */}
              <div className="grid w-full max-w-lg gap-2">
                {[
                  "Explain quantum computing in simple terms",
                  "Write a haiku about programming",
                  "What's the future of AI?",
                ].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => {
                      setInput(prompt);
                      textareaRef.current?.focus();
                    }}
                    className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-left text-sm text-white/60 transition hover:border-white/10 hover:bg-white/[0.04] hover:text-white/80"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6 pb-32 pt-8">
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
      </main>

      {/* Input area */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#0a0a0b] via-[#0a0a0b] to-transparent pb-6 pt-8">
        <div className="mx-auto w-full max-w-2xl px-4">
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] shadow-2xl shadow-black/50">
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
            <button
              disabled={sending || !input.trim()}
              onClick={send}
              className="absolute bottom-2.5 right-2.5 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-white transition hover:bg-emerald-400 disabled:opacity-30 disabled:hover:bg-emerald-500"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>

          {/* Footer info */}
          <div className="mt-3 flex items-center justify-center gap-3 text-xs text-white/30">
            {tokenCount > 0 && (
              <span>{tokenCount.toLocaleString()} tokens</span>
            )}
            <span>Free preview • <Link href="/api-docs" className="text-white/50 hover:text-white/70">Get API access →</Link></span>
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
        <div className={isUser ? "prose prose-sm prose-invert max-w-none" : "prose prose-sm prose-invert max-w-none"}>
          <Message role={role} content={content} />
        </div>
      </div>
    </div>
  );
}
