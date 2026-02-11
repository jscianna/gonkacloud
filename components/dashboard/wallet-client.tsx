"use client";

import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function WalletClient({ address }: { address: string | null }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [provisioning, setProvisioning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!address) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-slate-600">Wallet not provisioned yet.</p>
        <Button
          size="sm"
          disabled={provisioning}
          onClick={async () => {
            setProvisioning(true);
            setError(null);
            try {
              const res = await fetch("/api/admin/provision-wallet", { method: "POST" });
              const data = (await res.json().catch(() => null)) as { error?: string } | null;
              if (!res.ok) {
                setError(data?.error ?? "Failed to provision wallet");
                return;
              }
              router.refresh();
            } catch {
              setError("Failed to provision wallet");
            } finally {
              setProvisioning(false);
            }
          }}
        >
          {provisioning ? "Provisioning..." : "Provision Wallet"}
        </Button>
        {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="break-all rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm text-slate-900">{address}</p>
      <Button
        size="sm"
        variant="outline"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(address);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
          } catch {
            // ignore
          }
        }}
      >
        {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}
