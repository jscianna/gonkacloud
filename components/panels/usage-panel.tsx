"use client";

import { useEffect, useState } from "react";
import { Activity, Sparkles, TrendingUp, Loader2 } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type SubscriptionData = {
  status: "active" | "free" | "none";
  tokensAllocated: number;
  tokensUsed: number;
  tokensRemaining: number;
  currentPeriodEnd: string | null;
};

function formatTokens(n: number): string {
  if (n >= 1_000_000) {
    const millions = n / 1_000_000;
    return millions >= 10 ? `${Math.round(millions)}M` : `${millions.toFixed(1)}M`;
  }
  if (n >= 1_000) {
    return `${Math.round(n / 1_000)}K`;
  }
  return n.toString();
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function UsagePanel() {
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/subscription")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
      </div>
    );
  }

  if (!data || data.status === "none") {
    return (
      <Card className="border-white/[0.08] bg-white/[0.02]">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Activity className="h-12 w-12 text-white/20" />
          <p className="mt-4 text-lg font-medium text-white">No usage yet</p>
          <p className="mt-1 text-sm text-white/50">
            Create an API key and start making requests to see your usage.
          </p>
        </CardContent>
      </Card>
    );
  }

  const usagePercent = data.tokensAllocated > 0
    ? Math.min(100, Math.round((data.tokensUsed * 100) / data.tokensAllocated))
    : 0;

  const isFree = data.status === "free";

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-white/[0.08] bg-white/[0.02]">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 text-white/50">
              <Sparkles className="h-4 w-4" />
              Tokens Remaining
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-emerald-400">
              {formatTokens(data.tokensRemaining)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-white/[0.08] bg-white/[0.02]">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 text-white/50">
              <Activity className="h-4 w-4" />
              Tokens Used
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">{formatTokens(data.tokensUsed)}</p>
          </CardContent>
        </Card>

        <Card className="border-white/[0.08] bg-white/[0.02]">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 text-white/50">
              <TrendingUp className="h-4 w-4" />
              Usage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">{usagePercent}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card className="border-white/[0.08] bg-white/[0.02]">
        <CardHeader>
          <CardTitle className="text-white">{isFree ? "Free Tier" : "Current Period"}</CardTitle>
          <CardDescription className="text-white/50">
            {isFree
              ? "One-time 1M tokens • Upgrade for 100M/month"
              : `Resets on ${formatDate(data.currentPeriodEnd)}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-white/60">
              <span>{formatTokens(data.tokensUsed)} used</span>
              <span>{formatTokens(data.tokensAllocated)} allocated</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all"
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
