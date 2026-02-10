"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const quickAmounts = [10, 25, 50, 100] as const;

export function BillingClient() {
  const [selected, setSelected] = useState<number | null>(25);
  const [custom, setCustom] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const amount = useMemo(() => {
    const customAmount = Number(custom);
    if (custom.trim().length > 0 && Number.isFinite(customAmount)) {
      return customAmount;
    }
    return selected ?? 25;
  }, [custom, selected]);

  async function purchase() {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ amount }),
      });

      if (!res.ok) {
        return;
      }

      const payload = (await res.json()) as { url?: string };
      if (payload.url) {
        window.location.href = payload.url;
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {quickAmounts.map((value) => (
          <Button
            key={value}
            type="button"
            variant={selected === value && custom.trim().length === 0 ? "default" : "outline"}
            onClick={() => {
              setSelected(value);
              setCustom("");
            }}
          >
            ${value}
          </Button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="custom-amount">
            Custom amount
          </label>
          <Input
            id="custom-amount"
            inputMode="decimal"
            placeholder="e.g. 40"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
          />
          <p className="text-xs text-slate-500">Minimum $5. Maximum $500.</p>
        </div>

        <Button className="bg-emerald-600 text-white hover:bg-emerald-500" disabled={loading} onClick={purchase}>
          {loading ? "Redirecting..." : `Purchase $${amount}`}
        </Button>
      </div>
    </div>
  );
}
