import Link from "next/link";
import { and, count, eq, gte, sql } from "drizzle-orm";

import { UsageBarChart } from "@/components/dashboard/usage-bar-chart";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { usageLogs, apiSubscriptions } from "@/lib/db/schema";

function formatTokens(tokens: bigint | number): string {
  const n = typeof tokens === 'bigint' ? tokens : BigInt(Math.round(Number(tokens)));
  if (n >= 1_000_000n) {
    const millions = Number(n) / 1_000_000;
    return millions >= 10 ? `${Math.round(millions)}M` : `${millions.toFixed(1)}M`;
  }
  if (n >= 1_000n) {
    return `${Math.round(Number(n) / 1_000)}K`;
  }
  return n.toString();
}

export default async function DashboardPage() {
  const user = await getCurrentUser();

  const email = user?.clerkUser?.emailAddresses[0]?.emailAddress ?? user?.dbUser?.email ?? "there";

  // Get subscription and token balance
  let tokensRemaining = 0n;
  let hasSubscription = false;

  if (user?.dbUser?.id) {
    const subscription = await db.query.apiSubscriptions.findFirst({
      where: and(
        eq(apiSubscriptions.userId, user.dbUser.id),
        eq(apiSubscriptions.status, "active")
      ),
    });

    if (subscription) {
      hasSubscription = true;
      const allocated = subscription.tokensAllocated ?? 0n;
      const used = subscription.tokensUsed ?? 0n;
      tokensRemaining = allocated - used;
      if (tokensRemaining < 0n) tokensRemaining = 0n;
    }
  }

  let apiCalls = 0;
  let tokensUsed = 0;

  if (user?.dbUser?.id) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const [stats] = await db
      .select({
        apiCalls: count(usageLogs.id),
        tokensUsed: sql<number>`COALESCE(SUM(${usageLogs.promptTokens} + ${usageLogs.completionTokens}), 0)`,
      })
      .from(usageLogs)
      .where(and(eq(usageLogs.userId, user.dbUser.id), gte(usageLogs.createdAt, startDate)));

    apiCalls = Number(stats?.apiCalls ?? 0);
    tokensUsed = Number(stats?.tokensUsed ?? 0);
  }

  const tokenColor = !hasSubscription || tokensRemaining <= 0n ? "text-amber-400" : "text-emerald-400";

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-white">Welcome back</h1>
        <p className="mt-1 text-sm text-white/50">{email}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-white/[0.08] bg-white/[0.02]">
          <CardHeader>
            <CardDescription className="text-white/50">Tokens Remaining</CardDescription>
            <CardTitle className={`text-3xl ${tokenColor}`}>
              {hasSubscription ? formatTokens(tokensRemaining) : "—"}
            </CardTitle>
            {!hasSubscription && (
              <CardDescription className="text-amber-400/70">
                <Link href="/dashboard/billing" className="hover:underline">Subscribe to get started</Link>
              </CardDescription>
            )}
            {hasSubscription && tokensRemaining <= 0n && (
              <CardDescription className="text-amber-400/70">Out of tokens</CardDescription>
            )}
          </CardHeader>
        </Card>

        <Card className="border-white/[0.08] bg-white/[0.02]">
          <CardHeader>
            <CardDescription className="text-white/50">API Calls (30 days)</CardDescription>
            <CardTitle className="text-3xl text-white">{apiCalls.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-white/[0.08] bg-white/[0.02]">
          <CardHeader>
            <CardDescription className="text-white/50">Tokens Used (30 days)</CardDescription>
            <CardTitle className="text-3xl text-white">{formatTokens(tokensUsed)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="border-white/[0.08] bg-white/[0.02]">
        <CardHeader>
          <CardTitle className="text-white">Quick Start</CardTitle>
          <CardDescription className="text-white/50">Get moving quickly with API credentials, testing, and docs.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Link className={buttonVariants({ className: "bg-emerald-500 hover:bg-emerald-400" })} href="/dashboard/api-keys">
            Get API Key
          </Link>
          <Link className={buttonVariants({ variant: "outline", className: "border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.06]" })} href="/chat">
            Try Chat
          </Link>
          <Link className={buttonVariants({ variant: "outline", className: "border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.06]" })} href="/api-docs">
            API Docs
          </Link>
        </CardContent>
      </Card>

      <Card className="border-white/[0.08] bg-white/[0.02]">
        <CardHeader>
          <CardTitle className="text-white">Daily Usage (Last 7 Days)</CardTitle>
          <CardDescription className="text-white/50">Token volume from your latest API activity.</CardDescription>
        </CardHeader>
        <CardContent>
          <UsageBarChart />
        </CardContent>
      </Card>
    </section>
  );
}
