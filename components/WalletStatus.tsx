"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

type WalletStatusProps = {
  inferenceRegistered: boolean;
  inferenceRegisteredAt: string | null;
  hasBalance: boolean;
};

export function WalletStatus({ inferenceRegistered, inferenceRegisteredAt, hasBalance }: WalletStatusProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registeredDate = inferenceRegisteredAt ? new Date(inferenceRegisteredAt).toLocaleString("en-US") : null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm">
        <span
          className={`inline-block h-2.5 w-2.5 rounded-full ${
            inferenceRegistered ? "bg-emerald-500" : "bg-amber-500"
          }`}
        />
        <span className="font-medium text-slate-800">
          {inferenceRegistered ? "Wallet registered for inference" : "Inference registration required"}
        </span>
      </div>

      {registeredDate ? <p className="text-xs text-slate-500">Registered at: {registeredDate}</p> : null}

      {!inferenceRegistered ? (
        <div className="space-y-2">
          <p className="text-xs text-slate-600">
            {hasBalance
              ? "Wallet is funded. Enable inference registration now."
              : "Fund your wallet first, then enable inference registration."}
          </p>
          <Button
            size="sm"
            disabled={!hasBalance || submitting}
            onClick={async () => {
              setSubmitting(true);
              setError(null);
              try {
                const res = await fetch("/api/wallet/register-inference", { method: "POST" });
                const data = (await res.json().catch(() => null)) as { error?: string } | null;
                if (!res.ok) {
                  setError(data?.error ?? "Failed to register wallet for inference");
                  return;
                }
                router.refresh();
              } catch {
                setError("Failed to register wallet for inference");
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {submitting ? "Registering..." : "Enable Inference"}
          </Button>
        </div>
      ) : null}

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
    </div>
  );
}
