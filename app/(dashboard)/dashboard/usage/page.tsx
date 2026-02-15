import { eq, and, sql } from "drizzle-orm";
import { Activity, Sparkles, TrendingUp } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UsageBarChart } from "@/components/dashboard/usage-bar-chart";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiSubscriptions } from "@/lib/db/schema";

function formatTokens(tokens: bigint | number): string {
  const n = typeof tokens === 'bigint' ? tokens : BigInt(tokens);
  if (n >= 1_000_000n) {
    const millions = Number(n) / 1_000_000;
    return millions >= 10 ? `${Math.round(millions)}M` : `${millions.toFixed(1)}M`;
  }
  if (n >= 1_000n) {
    return `${Math.round(Number(n) / 1_000)}K`;
  }
  return n.toString();
}

function formatDate(date: Date | null): string {
  if (!date) return "—";
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default async function UsagePage() {
  const user = await getCurrentUser();

  let subscription = null;
  let tokensAllocated = 0n;
  let tokensUsed = 0n;
  let tokensRemaining = 0n;

  if (user?.dbUser?.id) {
    try {
      subscription = await db.query.apiSubscriptions.findFirst({
        where: and(
          eq(apiSubscriptions.userId, user.dbUser.id),
          sql`${apiSubscriptions.status} IN ('active', 'free')`
        ),
      });

      if (subscription) {
        tokensAllocated = subscription.tokensAllocated ?? 0n;
        tokensUsed = subscription.tokensUsed ?? 0n;
        tokensRemaining = tokensAllocated - tokensUsed;
        if (tokensRemaining < 0n) tokensRemaining = 0n;
      }
    } catch (e) {
      console.warn("Could not fetch subscription:", e instanceof Error ? e.message : e);
    }
  }

  const usagePercent = tokensAllocated > 0n 
    ? Math.min(100, Math.round(Number(tokensUsed * 100n / tokensAllocated)))
    : 0;

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Usage</h1>
        <p className="mt-1 text-sm text-white/60">
          Monitor your API token consumption.
        </p>
      </div>

      {subscription ? (
        <>
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
                <p className="text-3xl font-bold text-emerald-400">{formatTokens(tokensRemaining)}</p>
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
                <p className="text-3xl font-bold text-white">{formatTokens(tokensUsed)}</p>
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
              <CardTitle className="text-white">
                {subscription.status === "free" ? "Free Tier" : "Current Period"}
              </CardTitle>
              <CardDescription className="text-white/50">
                {subscription.status === "free" 
                  ? "One-time 1M tokens • Upgrade for 100M/month"
                  : `Resets on ${formatDate(subscription.currentPeriodEnd)}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-white/60">
                  <span>{formatTokens(tokensUsed)} used</span>
                  <span>{formatTokens(tokensAllocated)} allocated</span>
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

          {/* Daily Chart */}
          <Card className="border-white/[0.08] bg-white/[0.02]">
            <CardHeader>
              <CardTitle className="text-white">Daily Usage (Last 7 Days)</CardTitle>
              <CardDescription className="text-white/50">
                Token volume from your API activity.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UsageBarChart />
            </CardContent>
          </Card>
        </>
      ) : (
        <Card className="border-white/[0.08] bg-white/[0.02]">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Activity className="h-12 w-12 text-white/20" />
            <p className="mt-4 text-lg font-medium text-white">No usage yet</p>
            <p className="mt-1 text-sm text-white/50">
              Create an API key and start making requests to see your usage.
            </p>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
