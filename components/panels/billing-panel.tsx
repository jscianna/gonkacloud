"use client";

import { useEffect, useState } from "react";
import { Check, Sparkles, Zap, Loader2 } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type SubscriptionData = {
  status: "active" | "free" | "none";
  tokensAllocated: number;
  tokensUsed: number;
  tokensRemaining: number;
  currentPeriodEnd: string | null;
  email: string;
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

export function BillingPanel() {
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [openingPortal, setOpeningPortal] = useState(false);

  useEffect(() => {
    fetch("/api/subscription")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData({ status: "none", tokensAllocated: 0, tokensUsed: 0, tokensRemaining: 0, currentPeriodEnd: null, email: "" }))
      .finally(() => setLoading(false));
  }, []);

  const handleSubscribe = async () => {
    setSubscribing(true);
    try {
      const res = await fetch("/api/billing/subscribe", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Failed to start subscription");
      }
    } catch {
      alert("Failed to start subscription");
    } finally {
      setSubscribing(false);
    }
  };

  const handleManageSubscription = async () => {
    setOpeningPortal(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Failed to open billing portal");
      }
    } catch {
      alert("Failed to open billing portal");
    } finally {
      setOpeningPortal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!data || data.status === "none") {
    return (
      <Card className="border-emerald-200 bg-gradient-to-b from-emerald-50 to-white">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <Zap className="h-8 w-8 text-emerald-600" />
          </div>
          <CardTitle className="text-2xl text-gray-900">Get API Access</CardTitle>
          <CardDescription className="text-gray-600 text-base">
            Subscribe to unlock the full power of dogecat
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="mx-auto max-w-md space-y-4">
            <div className="text-center">
              <span className="text-4xl font-bold text-gray-900">$4.99</span>
              <span className="text-gray-500">/month</span>
            </div>

            <ul className="space-y-3 text-base text-gray-700">
              <li className="flex items-center gap-3">
                <Check className="h-5 w-5 flex-shrink-0 text-emerald-500" />
                <span>100 million tokens per month</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="h-5 w-5 flex-shrink-0 text-emerald-500" />
                <span>OpenAI-compatible API</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="h-5 w-5 flex-shrink-0 text-emerald-500" />
                <span>Multiple API keys</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="h-5 w-5 flex-shrink-0 text-emerald-500" />
                <span>Qwen3-235B model access</span>
              </li>
            </ul>

            <Button
              onClick={handleSubscribe}
              disabled={subscribing}
              className="w-full bg-emerald-500 text-white hover:bg-emerald-600 text-base py-6"
            >
              {subscribing ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : null}
              Subscribe Now
            </Button>

            <p className="text-center text-sm text-gray-500">
              Cancel anytime. Unused tokens don&apos;t roll over.
            </p>
          </div>
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
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Token Balance */}
        <Card className="border-gray-200 bg-white">
          <CardHeader>
            <CardDescription className="text-gray-500 text-base">Tokens Remaining</CardDescription>
            <CardTitle className="flex items-center gap-3 text-4xl">
              <Sparkles className="h-8 w-8 text-emerald-500" />
              <span className="text-gray-900">{formatTokens(data.tokensRemaining)}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-base text-gray-600">
                <span>Used {isFree ? "" : "this period"}</span>
                <span>
                  {formatTokens(data.tokensUsed)} / {formatTokens(data.tokensAllocated)}
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full bg-emerald-500 transition-all"
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Info */}
        <Card className="border-gray-200 bg-white">
          <CardHeader>
            <CardDescription className="text-gray-500 text-base">Current Plan</CardDescription>
            <CardTitle className="text-gray-900 text-2xl">{isFree ? "Free Tier" : "API Access"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-base">
              <span className="text-gray-600">Status</span>
              <span className="flex items-center gap-1 text-emerald-600">
                <Check className="h-5 w-5" />
                {isFree ? "Free" : "Active"}
              </span>
            </div>
            {!isFree && (
              <div className="flex items-center justify-between text-base">
                <span className="text-gray-600">Renews</span>
                <span className="text-gray-900">{formatDate(data.currentPeriodEnd)}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-base">
              <span className="text-gray-600">{isFree ? "Allocation" : "Price"}</span>
              <span className="text-gray-900">{isFree ? "1M tokens (one-time)" : "$4.99/month"}</span>
            </div>
            {isFree ? (
              <Button
                onClick={handleSubscribe}
                disabled={subscribing}
                className="w-full bg-emerald-500 text-white hover:bg-emerald-600 text-base"
              >
                {subscribing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                Upgrade to 100M/month
              </Button>
            ) : (
              <Button
                onClick={handleManageSubscription}
                disabled={openingPortal}
                variant="outline"
                className="w-full border-gray-300 text-gray-700 hover:bg-gray-100 text-base"
              >
                {openingPortal ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                Manage Subscription
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Out of tokens warning */}
      {data.tokensRemaining === 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="font-medium text-amber-800 text-base">You&apos;ve used all your tokens</p>
              <p className="text-base text-amber-700">
                {isFree
                  ? "Upgrade to get 100M tokens per month"
                  : `Your tokens will reset on ${formatDate(data.currentPeriodEnd)}`}
              </p>
            </div>
            {isFree && (
              <Button
                variant="outline"
                onClick={handleSubscribe}
                disabled={subscribing}
                className="border-amber-300 text-amber-800 hover:bg-amber-100"
              >
                Upgrade
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
