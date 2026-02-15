"use client";

import { ChevronDown, Send, Loader2, Sparkles } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState, useCallback } from "react";

import { Message } from "@/components/chat/Message";
import { Button } from "@/components/ui/button";
import {
  Conversation,
  Message as StoredMessage,
  getConversation,
  saveConversation,
  generateTitle,
} from "@/lib/conversations";

type ChatMsg = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const MODELS = ["Qwen/Qwen3-235B-A22B-Instruct-2507-FP8"] as const;
const MODEL_SHORT = "Qwen 235B";

interface PersistentChatProps {
  conversationId: string | null;
  onConversationUpdate: () => void;
  onNewConversation: () => void;
}

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

export function PersistentChat({
  conversationId,
  onConversationUpdate,
  onNewConversation,
}: PersistentChatProps) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [model, setModel] = useState<string>(MODELS[0]);
  const [input, setInput] = useState<string>("");
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);

  const listRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const conversationRef = useRef<Conversation | null>(null);

  const hasMessages = messages.length > 0;

  // Load conversation when ID changes
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      conversationRef.current = null;
      return;
    }

    const conv = getConversation(conversationId);
    if (conv) {
      conversationRef.current = conv;
      setMessages(
        conv.messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
        }))
      );
      setModel(conv.model);
    } else {
      setMessages([]);
      conversationRef.current = null;
    }
  }, [conversationId]);

  // Auto-scroll on new messages
  useEffect(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    });
  }, [messages.length, typing]);

  // Save messages to localStorage
  const saveMessages = useCallback(
    (msgs: ChatMsg[]) => {
      if (!conversationRef.current) return;

      const storedMessages: StoredMessage[] = msgs.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: Date.now(),
      }));

      const updatedConv: Conversation = {
        ...conversationRef.current,
        messages: storedMessages,
        title: generateTitle(storedMessages),
        updatedAt: Date.now(),
      };

      conversationRef.current = updatedConv;
      saveConversation(updatedConv);
      onConversationUpdate();
    },
    [onConversationUpdate]
  );

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

    // Create a new conversation if none exists
    if (!conversationId) {
      onNewConversation();
      // Wait a tick for the new conversation to be created
      await new Promise((r) => setTimeout(r, 50));
      return;
    }

    setSending(true);
    setTyping(true);
    setInput("");

    const userMsgId = uid("m");
    const assistantMsgId = uid("m");
    const userMsg: ChatMsg = { id: userMsgId, role: "user", content: text };
    const assistantMsg: ChatMsg = { id: assistantMsgId, role: "assistant", content: "" };

    const newMessages = [...messages, userMsg, assistantMsg];
    setMessages(newMessages);

    try {
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

        const errorMessages = newMessages.map((m) =>
          m.id === assistantMsgId ? { ...m, content: `⚠️ ${errorMessage}` } : m
        );
        setMessages(errorMessages);
        saveMessages(errorMessages.filter((m) => m.content !== ""));
        setTyping(false);
        setSending(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
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
                  m.id === assistantMsgId ? { ...m, content: fullContent } : m
                )
              );
            }
          }
        }
      }

      // Save final messages
      const finalMessages = newMessages.map((m) =>
        m.id === assistantMsgId ? { ...m, content: fullContent } : m
      );
      saveMessages(finalMessages);
    } finally {
      setTyping(false);
      setSending(false);
    }
  }

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Messages area */}
      <div ref={listRef} className="flex-1 overflow-auto">
        <div className="mx-auto w-full max-w-5xl px-6 py-6 lg:px-10">
          {!hasMessages ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative mb-4">
                <div className="absolute -inset-10 rounded-full bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 blur-2xl" />
                <Image
                  src="/logo.svg"
                  alt="dogecat"
                  width={200}
                  height={200}
                  className="relative rounded-2xl"
                />
              </div>
              <h1 className="mb-2 text-4xl font-semibold text-gray-900">dogecat</h1>
              <p className="text-xl text-gray-500">Private AI chat</p>
              <p className="mt-3 max-w-lg text-center text-base text-gray-400">
                Your conversations are stored locally in your browser.
                {!conversationId && " Start typing to begin."}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-8">
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
      </div>

      {/* Input area */}
      <div className="border-t border-gray-200 bg-gray-50 px-4 py-5 lg:px-10">
        <div className="mx-auto w-full max-w-5xl">
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
            <Button
              size="sm"
              disabled={sending || !input.trim()}
              onClick={send}
              className="absolute bottom-3 right-3 h-10 w-10 rounded-xl bg-emerald-500 p-0 text-white hover:bg-emerald-600 disabled:opacity-30"
            >
              {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
          </div>

          <div className="mt-3 flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-500" />
              <select
                className="appearance-none bg-transparent text-gray-600 focus:outline-none"
                value={model}
                onChange={(e) => setModel(e.target.value)}
              >
                {MODELS.map((m) => (
                  <option key={m} value={m}>
                    {MODEL_SHORT}
                  </option>
                ))}
              </select>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </div>
            <span className="text-gray-400">Stored locally in your browser</span>
          </div>
        </div>
      </div>
    </div>
  );
}

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
