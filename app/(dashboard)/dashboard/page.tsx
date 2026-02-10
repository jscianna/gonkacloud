import Link from "next/link";
import { and, count, eq, gte, sql } from "drizzle-orm";

import { UsageBarChart } from "@/components/dashboard/usage-bar-chart";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { usageLogs } from "@/lib/db/schema";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

export default async function DashboardPage() {
  const user = await getCurrentUser();

  const email = user?.clerkUser?.emailAddresses[0]?.emailAddress ?? user?.dbUser?.email ?? "there";
  const balance = Number.parseFloat(user?.dbUser?.balanceUsd ?? "0");
  const safeBalance = Number.isFinite(balance) ? balance : 0;

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

  const balanceColor = safeBalance < 5 ? "text-amber-600" : "text-emerald-600";

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Welcome back, {email}</h1>
        <p className="mt-1 text-sm text-slate-600">Your GonkaCloud usage and account health at a glance.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Current Balance</CardDescription>
            <CardTitle className={`text-3xl ${balanceColor}`}>{formatCurrency(safeBalance)}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>API Calls (last 30 days)</CardDescription>
            <CardTitle className="text-3xl text-slate-900">{apiCalls.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Tokens Used (last 30 days)</CardDescription>
            <CardTitle className="text-3xl text-slate-900">{tokensUsed.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Start</CardTitle>
          <CardDescription>Get moving quickly with API credentials, testing, and docs.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Link className={buttonVariants()} href="/dashboard/api-keys">
            Get API Key
          </Link>
          <Link className={buttonVariants({ variant: "outline" })} href="/chat">
            Try Chat
          </Link>
          <Link className={buttonVariants({ variant: "outline" })} href="https://docs.gonka.ai" rel="noreferrer" target="_blank">
            View Docs
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daily Usage (Last 7 Days)</CardTitle>
          <CardDescription>Token volume from your latest API activity.</CardDescription>
        </CardHeader>
        <CardContent>
          <UsageBarChart />
        </CardContent>
      </Card>
    </section>
  );
}
