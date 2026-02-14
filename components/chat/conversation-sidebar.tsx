"use client";

import { MessageSquarePlus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type Conversation = {
  id: string;
  title: string;
  updatedAt: string;
};

type Props = {
  activeId: string | null;
  onSelect: (id: string | null) => void;
  onNew: () => void;
  refreshKey?: number;
};

export function ConversationSidebar({ activeId, onSelect, onNew, refreshKey }: Props) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  useEffect(() => {
    loadConversations();
  }, [refreshKey]);

  async function loadConversations() {
    try {
      const res = await fetch("/api/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    const confirmed = confirm("Delete this conversation?");
    if (!confirmed) return;

    await fetch(`/api/conversations/${id}`, { method: "DELETE" });
    setConversations((prev) => prev.filter((c) => c.id !== id));
    
    if (activeId === id) {
      onSelect(null);
    }
  }

  async function handleRename(id: string) {
    if (!editTitle.trim()) {
      setEditingId(null);
      return;
    }

    await fetch(`/api/conversations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: editTitle }),
    });

    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: editTitle } : c))
    );
    setEditingId(null);
  }

  function startEditing(convo: Conversation) {
    setEditingId(convo.id);
    setEditTitle(convo.title);
  }

  return (
    <div className="flex h-full w-64 flex-col border-r border-white/[0.08] bg-black/20">
      {/* New Chat Button */}
      <div className="p-3">
        <Button
          onClick={onNew}
          variant="outline"
          className="w-full justify-start gap-2 border-white/10 bg-white/5 text-white hover:bg-white/10"
        >
          <MessageSquarePlus className="h-4 w-4" />
          New chat
        </Button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {loading ? (
          <p className="px-3 py-2 text-sm text-white/40">Loading...</p>
        ) : conversations.length === 0 ? (
          <p className="px-3 py-2 text-sm text-white/40">No conversations yet</p>
        ) : (
          <div className="space-y-1">
            {conversations.map((convo) => (
              <div
                key={convo.id}
                className={cn(
                  "group flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                  activeId === convo.id
                    ? "bg-white/10 text-white"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                )}
              >
                {editingId === convo.id ? (
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={() => handleRename(convo.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRename(convo.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    className="flex-1 bg-transparent outline-none"
                    autoFocus
                  />
                ) : (
                  <button
                    onClick={() => onSelect(convo.id)}
                    className="flex-1 truncate text-left"
                  >
                    {convo.title}
                  </button>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="opacity-0 group-hover:opacity-100 focus:opacity-100">
                      <MoreHorizontal className="h-4 w-4 text-white/50 hover:text-white" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={() => startEditing(convo)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(convo.id)}
                      className="text-red-400 focus:text-red-400"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
