"use client";

import { Plus, MessageSquare, Trash2, MoreHorizontal } from "lucide-react";
import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Conversation,
  getConversations,
  deleteConversation,
  getCurrentConversationId,
} from "@/lib/conversations";
import { cn } from "@/lib/utils";

interface ConversationSidebarProps {
  currentId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  refreshKey?: number;
}

export function ConversationSidebar({
  currentId,
  onSelect,
  onNew,
  onDelete,
  refreshKey,
}: ConversationSidebarProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    setConversations(getConversations());
  }, [refreshKey]);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onDelete(id);
    setConversations(getConversations());
  };

  // Group conversations by date
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const groups: { label: string; items: Conversation[] }[] = [];
  
  const todayItems = conversations.filter((c) => c.updatedAt >= today.getTime());
  const yesterdayItems = conversations.filter(
    (c) => c.updatedAt >= yesterday.getTime() && c.updatedAt < today.getTime()
  );
  const weekItems = conversations.filter(
    (c) => c.updatedAt >= weekAgo.getTime() && c.updatedAt < yesterday.getTime()
  );
  const olderItems = conversations.filter((c) => c.updatedAt < weekAgo.getTime());

  if (todayItems.length > 0) groups.push({ label: "Today", items: todayItems });
  if (yesterdayItems.length > 0) groups.push({ label: "Yesterday", items: yesterdayItems });
  if (weekItems.length > 0) groups.push({ label: "Previous 7 days", items: weekItems });
  if (olderItems.length > 0) groups.push({ label: "Older", items: olderItems });

  return (
    <div className="flex h-full flex-col">
      {/* New chat button */}
      <div className="p-3">
        <Button
          onClick={onNew}
          variant="outline"
          className="w-full justify-start gap-2 border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.06]"
        >
          <Plus className="h-4 w-4" />
          New chat
        </Button>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {groups.length === 0 ? (
          <div className="px-3 py-8 text-center text-sm text-white/30">
            No conversations yet
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.label} className="mb-4">
              <div className="px-3 py-2 text-xs font-medium text-white/40">
                {group.label}
              </div>
              <div className="space-y-0.5">
                {group.items.map((conv) => (
                  <ConversationItem
                    key={conv.id}
                    conversation={conv}
                    isActive={conv.id === currentId}
                    onSelect={() => onSelect(conv.id)}
                    onDelete={(e) => handleDelete(e, conv.id)}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ConversationItem({
  conversation,
  isActive,
  onSelect,
  onDelete,
}: {
  conversation: Conversation;
  isActive: boolean;
  onSelect: () => void;
  onDelete: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      onClick={onSelect}
      className={cn(
        "group relative flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
        isActive
          ? "bg-emerald-500/10 text-emerald-400"
          : "text-white/60 hover:bg-white/[0.06] hover:text-white"
      )}
    >
      <MessageSquare className="h-4 w-4 shrink-0" />
      <span className="flex-1 truncate">{conversation.title}</span>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            onClick={(e) => e.stopPropagation()}
            className="opacity-0 group-hover:opacity-100 hover:text-white"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="border-white/10 bg-[#1a1a1b] text-white"
        >
          <DropdownMenuItem
            onClick={onDelete}
            className="text-red-400 focus:bg-red-500/10 focus:text-red-400"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
