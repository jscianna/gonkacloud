import { eq, and } from "drizzle-orm";
import { Check, Sparkles, Zap } from "lucide-react";
import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

export default async function BillingPage() {
  const user = await getCurrentUser();
  const email = user?.clerkUser?.emailAddresses[0]?.emailAddress ?? "";

  // Get subscription (fail-safe if table doesn't exist)
  let subscription = null;
  let tokensAllocated = 0n;
  let tokensUsed = 0n;
  let tokensRemaining = 0n;

  if (user?.dbUser?.id) {
    try {
      subscription = await db.query.apiSubscriptions.findFirst({
        where: and(
          eq(apiSubscriptions.userId, user.dbUser.id),
          eq(apiSubscriptions.status, "active")
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
        <h1 className="text-2xl font-semibold tracking-tight">Subscription</h1>
        <p className="mt-1 text-sm text-white/60">
          Manage your API subscription{email ? ` for ${email}` : ""}.
        </p>
      </div>

      {subscription ? (
        // Active subscription view
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Token Balance */}
          <Card className="border-white/[0.08] bg-white/[0.02]">
            <CardHeader>
              <CardDescription className="text-white/50">Tokens Remaining</CardDescription>
              <CardTitle className="flex items-center gap-3 text-4xl">
                <Sparkles className="h-8 w-8 text-emerald-400" />
                <span className="text-white">{formatTokens(tokensRemaining)}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-white/60">
                  <span>Used this period</span>
                  <span>{formatTokens(tokensUsed)} / {formatTokens(tokensAllocated)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div 
                    className="h-full bg-emerald-500 transition-all" 
                    style={{ width: `${usagePercent}%` }} 
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Info */}
          <Card className="border-white/[0.08] bg-white/[0.02]">
            <CardHeader>
              <CardDescription className="text-white/50">Current Plan</CardDescription>
              <CardTitle className="text-white">API Access</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-white/60">Status</span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <Check className="h-4 w-4" />
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/60">Renews</span>
                <span className="text-white">{formatDate(subscription.currentPeriodEnd)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/60">Price</span>
                <span className="text-white">$2.99/month</span>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        // No subscription - show subscribe offer
        <Card className="border-emerald-500/30 bg-gradient-to-b from-emerald-500/10 to-transparent">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
              <Zap className="h-8 w-8 text-emerald-400" />
            </div>
            <CardTitle className="text-2xl text-white">Get API Access</CardTitle>
            <CardDescription className="text-white/60">
              Subscribe to unlock the full power of dogecat
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="mx-auto max-w-md space-y-4">
              <div className="text-center">
                <span className="text-4xl font-bold text-white">$2.99</span>
                <span className="text-white/50">/month</span>
              </div>

              <ul className="space-y-3 text-sm text-white/70">
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 flex-shrink-0 text-emerald-400" />
                  <span>100 million tokens per month</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 flex-shrink-0 text-emerald-400" />
                  <span>OpenAI-compatible API</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 flex-shrink-0 text-emerald-400" />
                  <span>Multiple API keys</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 flex-shrink-0 text-emerald-400" />
                  <span>Qwen3-235B model access</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 flex-shrink-0 text-emerald-400" />
                  <span>Priority support</span>
                </li>
              </ul>

              <Button className="w-full bg-emerald-500 py-6 text-lg font-semibold text-white hover:bg-emerald-400">
                Subscribe Now
              </Button>

              <p className="text-center text-xs text-white/40">
                Cancel anytime. Unused tokens don&apos;t roll over.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Out of tokens warning */}
      {subscription && tokensRemaining === 0n && (
        <Card className="border-amber-500/30 bg-amber-500/10">
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="font-medium text-amber-200">You&apos;ve used all your tokens</p>
              <p className="text-sm text-amber-200/70">
                Your tokens will reset on {formatDate(subscription.currentPeriodEnd)}
              </p>
            </div>
            <Button variant="outline" className="border-amber-500/30 text-amber-200 hover:bg-amber-500/20">
              Get More Tokens
            </Button>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
