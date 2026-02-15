"use client";

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
};

export type Conversation = {
  id: string;
  title: string;
  messages: Message[];
  model: string;
  createdAt: number;
  updatedAt: number;
};

const STORAGE_KEY = "dogecat_conversations";
const CURRENT_KEY = "dogecat_current_conversation";

function uid(): string {
  return `conv_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

export function getConversations(): Conversation[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data) as Conversation[];
    // Sort by updatedAt descending (most recent first)
    return parsed.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

export function getConversation(id: string): Conversation | null {
  const conversations = getConversations();
  return conversations.find((c) => c.id === id) ?? null;
}

export function saveConversation(conversation: Conversation): void {
  if (typeof window === "undefined") return;
  const conversations = getConversations();
  const index = conversations.findIndex((c) => c.id === conversation.id);
  
  if (index >= 0) {
    conversations[index] = conversation;
  } else {
    conversations.unshift(conversation);
  }
  
  // Keep max 50 conversations
  const trimmed = conversations.slice(0, 50);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

export function deleteConversation(id: string): void {
  if (typeof window === "undefined") return;
  const conversations = getConversations();
  const filtered = conversations.filter((c) => c.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  
  // If we deleted the current conversation, clear it
  if (getCurrentConversationId() === id) {
    setCurrentConversationId(null);
  }
}

export function getCurrentConversationId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CURRENT_KEY);
}

export function setCurrentConversationId(id: string | null): void {
  if (typeof window === "undefined") return;
  if (id) {
    localStorage.setItem(CURRENT_KEY, id);
  } else {
    localStorage.removeItem(CURRENT_KEY);
  }
}

export function createNewConversation(model: string): Conversation {
  const now = Date.now();
  const conversation: Conversation = {
    id: uid(),
    title: "New chat",
    messages: [],
    model,
    createdAt: now,
    updatedAt: now,
  };
  saveConversation(conversation);
  setCurrentConversationId(conversation.id);
  return conversation;
}

export function generateTitle(messages: Message[]): string {
  // Get first user message and truncate
  const firstUser = messages.find((m) => m.role === "user");
  if (!firstUser) return "New chat";
  
  const content = firstUser.content.trim();
  if (content.length <= 30) return content;
  return content.slice(0, 30) + "...";
}

export function clearAllConversations(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(CURRENT_KEY);
}
