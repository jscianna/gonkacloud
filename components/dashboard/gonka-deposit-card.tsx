"use client";

import { Check, Copy, QrCode, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

import { Button } from "@/components/ui/button";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type WalletBalancePayload = {
  address: string;
  balance: {
    gonka: string;
    ngonka: string;
  };
};

function truncateAddress(address: string) {
  if (address.length <= 20) return address;
  return `${address.slice(0, 10)}...${address.slice(-8)}`;
}

export function GonkaDepositCard() {
  const [payload, setPayload] = useState<WalletBalancePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expandedQr, setExpandedQr] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWalletBalance = useCallback(async (withSpinner = false) => {
    if (withSpinner) setRefreshing(true);
    try {
      const res = await fetch("/api/wallet/balance", { cache: "no-store" });
      const data = (await res.json()) as WalletBalancePayload | { error?: string };

      if (!res.ok || !("address" in data)) {
        setError("Wallet not provisioned yet.");
        setPayload(null);
        return;
      }

      setPayload(data);
      setError(null);
    } catch {
      setError("Could not load Gonka wallet balance.");
      setPayload(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchWalletBalance();
  }, [fetchWalletBalance]);

  const displayAddress = useMemo(() => (payload?.address ? truncateAddress(payload.address) : ""), [payload?.address]);

  return (
    <div className="space-y-4">
      <CardHeader className="px-0 pt-0">
        <CardTitle>Deposit Gonka Tokens</CardTitle>
        <CardDescription>Send tokens directly to your wallet.</CardDescription>
      </CardHeader>

      <p className="text-sm text-slate-600">Send GONKA tokens to this address. Balance updates automatically.</p>

      {loading ? (
        <p className="text-sm text-slate-500">Loading wallet...</p>
      ) : error ? (
        <p className="text-sm text-rose-600">{error}</p>
      ) : payload ? (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-slate-500">Wallet Address</p>
              <p className="truncate font-mono text-sm text-slate-900" title={payload.address}>
                {displayAddress}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(payload.address);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1200);
                } catch {
                  // Ignore clipboard errors in unsupported contexts.
                }
              }}
            >
              {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>

          <div className="flex flex-col gap-4 rounded-lg border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Current Balance</p>
              <p className="text-2xl font-semibold tracking-tight text-slate-900">{payload.balance.gonka} GONKA</p>
              <p className="font-mono text-xs text-slate-500">{payload.balance.ngonka} ngonka</p>
            </div>
            <Button size="sm" variant="outline" disabled={refreshing} onClick={() => void fetchWalletBalance(true)}>
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          <div className="flex flex-col items-start gap-3 rounded-lg border border-slate-200 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
              <QrCode className="h-4 w-4" />
              Deposit QR
            </div>
            <QRCodeSVG value={payload.address} size={expandedQr ? 224 : 120} className="rounded-md border border-slate-200 bg-white p-2" />
            <Button size="sm" variant="outline" onClick={() => setExpandedQr((value) => !value)}>
              {expandedQr ? "Collapse QR" : "Expand QR"}
            </Button>
          </div>

          <p className="text-xs text-slate-500">Custodial wallet is deposit-only for users. Withdrawals are not available from this interface.</p>
        </div>
      ) : null}
    </div>
  );
}
