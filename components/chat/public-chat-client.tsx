"use client";

import { Send, Loader2, Sparkles } from "lucide-react";
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
    const lineHeight = 28;
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
    <div className="flex min-h-screen flex-col bg-white">
      {/* Header */}
      <header className="fixed top-0 z-50 flex w-full items-center justify-between border-b border-gray-200 bg-white/95 backdrop-blur px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 text-sm font-medium text-gray-600">
            <Sparkles className="h-4 w-4 text-emerald-500" />
            <span>{MODEL_SHORT}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link 
            href="/api-docs" 
            className="rounded-full border border-gray-300 bg-white px-4 py-1.5 text-base font-medium text-gray-700 transition hover:border-gray-400 hover:bg-gray-50"
          >
            API
          </Link>
          <Link 
            href="/sign-up" 
            className="rounded-full bg-emerald-500 px-4 py-1.5 text-base font-medium text-white transition hover:bg-emerald-600"
          >
            Get 1M Free Tokens
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main ref={listRef} className="flex-1 overflow-auto pt-20">
        <div className="mx-auto w-full max-w-5xl px-6 lg:px-10">
          {!hasMessages ? (
            <div className="flex min-h-[calc(100vh-220px)] flex-col items-center justify-center">
              {/* Logo */}
              <div className="relative mb-8">
                <div className="absolute -inset-8 rounded-full bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 blur-2xl" />
                <Image
                  src="/logo.svg"
                  alt="dogecat"
                  width={140}
                  height={140}
                  className="relative rounded-3xl drop-shadow-xl"
                />
              </div>
              
              {/* Brand name */}
              <h1 className="mb-3 text-5xl font-bold tracking-tight text-gray-900">
                dogecat
              </h1>
              
              {/* Tagline */}
              <p className="mb-10 text-lg text-gray-500">
                Decentralized AI inference
              </p>

              {/* Example prompts */}
              <div className="grid w-full max-w-lg gap-3">
                {[
                  "Plan a surprise birthday party for under $200",
                  "Write a resignation letter that doesn't burn bridges",
                  "Explain the stock market like I'm 10 years old",
                ].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => {
                      setInput(prompt);
                      textareaRef.current?.focus();
                    }}
                    className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-4 text-left text-base text-gray-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-gray-900"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-8 pb-40 pt-8">
              {messages.map((m) => (
                <MessageBubble key={m.id} role={m.role} content={m.content} />
              ))}

              {typing && messages[messages.length - 1]?.content === "" && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-2xl bg-gray-100 px-5 py-3 text-base text-gray-600">
                    <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
                    <span>Thinking...</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Input area */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-gray-50 pb-6 pt-5">
        <div className="mx-auto w-full max-w-5xl px-6 lg:px-10">
          <div className="relative overflow-hidden rounded-2xl border border-gray-300 bg-white shadow-sm">
            <textarea
              ref={textareaRef}
              className="w-full resize-none bg-transparent px-5 py-4 pr-16 text-[18px] text-gray-900 placeholder:text-gray-400 focus:outline-none"
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
              className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white transition hover:bg-emerald-600 disabled:opacity-30 disabled:hover:bg-emerald-500"
            >
              {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </button>
          </div>

          {/* Footer info */}
          <div className="mt-3 flex flex-col items-center gap-2">
            <div className="flex items-center justify-center gap-3 text-sm text-gray-500">
              {tokenCount > 0 && (
                <span>{tokenCount.toLocaleString()} tokens</span>
              )}
              <span>Sign up for 1M free tokens • <Link href="/sign-up" className="text-emerald-600 hover:text-emerald-700 font-medium">Get started →</Link></span>
            </div>
            <div className="flex items-center justify-center gap-4 text-sm text-gray-400">
              <Link href="/legal/terms" className="hover:text-gray-600 transition">Terms</Link>
              <Link href="/legal/privacy" className="hover:text-gray-600 transition">Privacy</Link>
              <Link href="/legal/acceptable-use" className="hover:text-gray-600 transition">Acceptable Use</Link>
              <Link href="/legal/disclaimer" className="hover:text-gray-600 transition">Disclaimer</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Light-themed message component
function MessageBubble({ role, content }: { role: "user" | "assistant"; content: string }) {
  const isUser = role === "user";

  if (!content) return null;

  return (
    <div className={isUser ? "flex justify-end" : "flex justify-start"}>
      <div
        className={
          isUser
            ? "max-w-[85%] rounded-2xl bg-emerald-500 px-5 py-3 text-[18px] leading-relaxed text-white sm:max-w-[80%]"
            : "max-w-[85%] text-[18px] leading-relaxed text-gray-800 sm:max-w-[80%]"
        }
      >
        <Message role={role} content={content} />
      </div>
    </div>
  );
}
