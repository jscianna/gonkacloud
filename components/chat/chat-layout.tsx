"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { UserButton } from "@clerk/nextjs";
import {
  Menu,
  Sparkles,
  KeyRound,
  BarChart3,
  CreditCard,
  Code2,
  ExternalLink,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ConversationSidebar } from "@/components/chat/conversation-sidebar";
import { PersistentChat } from "@/components/chat/persistent-chat";
import { PanelWrapper } from "@/components/panels/panel-wrapper";
import { BillingPanel } from "@/components/panels/billing-panel";
import { UsagePanel } from "@/components/panels/usage-panel";
import { ApiKeysPanel } from "@/components/panels/api-keys-panel";
import {
  getConversations,
  getCurrentConversationId,
  setCurrentConversationId,
  createNewConversation,
  deleteConversation,
} from "@/lib/conversations";
import { cn } from "@/lib/utils";

type PanelType = "billing" | "usage" | "api-keys" | null;

const NAV_ITEMS = [
  { id: "api-keys" as const, label: "API Keys", icon: KeyRound },
  { id: "usage" as const, label: "Usage", icon: BarChart3 },
  { id: "billing" as const, label: "Billing", icon: CreditCard },
];

interface ChatLayoutProps {
  tokensRemaining: number;
  hasSubscription: boolean;
}

export function ChatLayout({ tokensRemaining, hasSubscription }: ChatLayoutProps) {
  const [currentConversationId, setCurrentConvId] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<PanelType>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Initialize on mount
  useEffect(() => {
    const savedId = getCurrentConversationId();
    if (savedId) {
      setCurrentConvId(savedId);
    }
  }, []);

  const handleSelectConversation = useCallback((id: string) => {
    setCurrentConvId(id);
    setCurrentConversationId(id);
    setMobileMenuOpen(false);
  }, []);

  const handleNewConversation = useCallback(() => {
    const conv = createNewConversation("Qwen/Qwen3-235B-A22B-Instruct-2507-FP8");
    setCurrentConvId(conv.id);
    setRefreshKey((k) => k + 1);
    setMobileMenuOpen(false);
  }, []);

  const handleDeleteConversation = useCallback((id: string) => {
    deleteConversation(id);
    if (currentConversationId === id) {
      const remaining = getConversations();
      if (remaining.length > 0) {
        setCurrentConvId(remaining[0].id);
        setCurrentConversationId(remaining[0].id);
      } else {
        setCurrentConvId(null);
        setCurrentConversationId(null);
      }
    }
    setRefreshKey((k) => k + 1);
  }, [currentConversationId]);

  const handleConversationUpdate = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const openPanel = (panel: PanelType) => {
    setActivePanel(panel);
    setMobileMenuOpen(false);
  };

  const formatTokens = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
    return n.toString();
  };

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Conversations */}
      <div className="flex-1 overflow-hidden">
        <ConversationSidebar
          currentId={currentConversationId}
          onSelect={handleSelectConversation}
          onNew={handleNewConversation}
          onDelete={handleDeleteConversation}
          refreshKey={refreshKey}
        />
      </div>

      {/* Navigation */}
      <div className="border-t border-white/[0.06] p-3">
        <div className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => openPanel(item.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  "text-white/60 hover:bg-white/[0.06] hover:text-white"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
          <Link
            href="/api-docs"
            target="_blank"
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              "text-white/60 hover:bg-white/[0.06] hover:text-white"
            )}
          >
            <Code2 className="h-4 w-4" />
            <span>API Docs</span>
            <ExternalLink className="ml-auto h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#0a0a0b] text-white">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 flex-shrink-0 border-r border-white/[0.06] md:flex md:flex-col">
        <div className="border-b border-white/[0.06] px-4 py-4">
          <Link className="flex items-center gap-2" href="/">
            <Image alt="dogecat logo" className="rounded" height={24} src="/logo.svg" width={24} />
            <span className="text-base font-semibold tracking-tight">dogecat</span>
          </Link>
        </div>
        {sidebarContent}
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-14 flex-shrink-0 items-center justify-between border-b border-white/[0.06] px-4">
          <div className="flex items-center gap-2">
            {/* Mobile menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  className="md:hidden border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.06]"
                  size="sm"
                  variant="outline"
                >
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-72 border-white/[0.06] bg-[#0a0a0b] p-0"
              >
                <div className="border-b border-white/[0.06] px-4 py-4">
                  <Link className="flex items-center gap-2" href="/">
                    <Image
                      alt="dogecat logo"
                      className="rounded"
                      height={24}
                      src="/logo.svg"
                      width={24}
                    />
                    <span className="text-base font-semibold tracking-tight">dogecat</span>
                  </Link>
                </div>
                {sidebarContent}
              </SheetContent>
            </Sheet>

            <span className="text-sm text-white/40 md:hidden">dogecat</span>
          </div>

          <div className="flex items-center gap-3">
            {hasSubscription ? (
              <button
                onClick={() => openPanel("usage")}
                className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-sm font-medium text-white/70 transition-colors hover:bg-white/[0.06] sm:flex"
              >
                <Sparkles className="h-4 w-4 text-emerald-400" />
                <span>{formatTokens(tokensRemaining)} tokens</span>
              </button>
            ) : (
              <Button
                onClick={() => openPanel("billing")}
                className="bg-emerald-500 text-white hover:bg-emerald-400"
                size="sm"
              >
                Subscribe
              </Button>
            )}
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8",
                },
              }}
            />
          </div>
        </header>

        {/* Chat Area */}
        <main className="flex-1 overflow-hidden">
          <PersistentChat
            conversationId={currentConversationId}
            onConversationUpdate={handleConversationUpdate}
            onNewConversation={handleNewConversation}
          />
        </main>
      </div>

      {/* Panels */}
      <PanelWrapper
        open={activePanel === "billing"}
        onClose={() => setActivePanel(null)}
        title="Subscription"
      >
        <BillingPanel />
      </PanelWrapper>

      <PanelWrapper
        open={activePanel === "usage"}
        onClose={() => setActivePanel(null)}
        title="Usage"
      >
        <UsagePanel />
      </PanelWrapper>

      <PanelWrapper
        open={activePanel === "api-keys"}
        onClose={() => setActivePanel(null)}
        title="API Keys"
      >
        <ApiKeysPanel />
      </PanelWrapper>
    </div>
  );
}
