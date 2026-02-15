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
        <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!data || data.status === "none") {
    return (
      <Card className="border-gray-200 bg-white">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Activity className="h-12 w-12 text-gray-300" />
          <p className="mt-4 text-xl font-medium text-gray-900">No usage yet</p>
          <p className="mt-1 text-base text-gray-500">
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
        <Card className="border-gray-200 bg-white">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 text-gray-500 text-base">
              <Sparkles className="h-5 w-5" />
              Tokens Remaining
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-emerald-600">
              {formatTokens(data.tokensRemaining)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-white">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 text-gray-500 text-base">
              <Activity className="h-5 w-5" />
              Tokens Used
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">{formatTokens(data.tokensUsed)}</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-white">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 text-gray-500 text-base">
              <TrendingUp className="h-5 w-5" />
              Usage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">{usagePercent}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card className="border-gray-200 bg-white">
        <CardHeader>
          <CardTitle className="text-gray-900 text-xl">{isFree ? "Free Tier" : "Current Period"}</CardTitle>
          <CardDescription className="text-gray-500 text-base">
            {isFree
              ? "One-time 1M tokens • Upgrade for 100M/month"
              : `Resets on ${formatDate(data.currentPeriodEnd)}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-base text-gray-600">
              <span>{formatTokens(data.tokensUsed)} used</span>
              <span>{formatTokens(data.tokensAllocated)} allocated</span>
            </div>
            <div className="h-4 overflow-hidden rounded-full bg-gray-200">
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
