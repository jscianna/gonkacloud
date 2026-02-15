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
      <div className="border-t border-gray-200 p-3">
        <div className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => openPanel(item.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-base font-medium transition-colors",
                  "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
          <Link
            href="/api-docs"
            target="_blank"
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-base font-medium transition-colors",
              "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            )}
          >
            <Code2 className="h-5 w-5" />
            <span>API Docs</span>
            <ExternalLink className="ml-auto h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-white text-gray-900">
      {/* Desktop Sidebar */}
      <aside className="hidden w-72 flex-shrink-0 border-r border-gray-200 bg-gray-50 md:flex md:flex-col">
        <div className="border-b border-gray-200 px-4 py-4">
          <Link className="flex items-center gap-2" href="/">
            <Image alt="dogecat logo" className="rounded" height={28} src="/logo.svg" width={28} />
            <span className="text-lg font-semibold tracking-tight text-gray-900">dogecat</span>
          </Link>
        </div>
        {sidebarContent}
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4">
          <div className="flex items-center gap-2">
            {/* Mobile menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  className="md:hidden border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                  size="sm"
                  variant="outline"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-72 border-gray-200 bg-gray-50 p-0"
              >
                <div className="border-b border-gray-200 px-4 py-4">
                  <Link className="flex items-center gap-2" href="/">
                    <Image
                      alt="dogecat logo"
                      className="rounded"
                      height={28}
                      src="/logo.svg"
                      width={28}
                    />
                    <span className="text-lg font-semibold tracking-tight text-gray-900">dogecat</span>
                  </Link>
                </div>
                {sidebarContent}
              </SheetContent>
            </Sheet>

            <span className="text-base text-gray-500 md:hidden">dogecat</span>
          </div>

          <div className="flex items-center gap-3">
            {hasSubscription ? (
              <button
                onClick={() => openPanel("usage")}
                className="hidden items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-1.5 text-base font-medium text-gray-700 transition-colors hover:bg-gray-100 sm:flex"
              >
                <Sparkles className="h-5 w-5 text-emerald-500" />
                <span>{formatTokens(tokensRemaining)} tokens</span>
              </button>
            ) : (
              <Button
                onClick={() => openPanel("billing")}
                className="bg-emerald-500 text-white hover:bg-emerald-600 text-base"
                size="default"
              >
                Subscribe
              </Button>
            )}
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "h-9 w-9",
                },
              }}
            />
          </div>
        </header>

        {/* Chat Area */}
        <main className="flex-1 overflow-hidden bg-white">
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
