import { eq } from "drizzle-orm";

import { WalletClient } from "@/components/dashboard/wallet-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getBalance } from "@/lib/wallet/gonka";

export default async function WalletPage() {
  const current = await getCurrentUser();

  const userId = current?.dbUser?.id;

  let gonkaAddress: string | null = null;
  let balance: { gonka: string; ngonka: string } | null = null;

  if (userId) {
    const [row] = await db.select({ gonkaAddress: users.gonkaAddress }).from(users).where(eq(users.id, userId)).limit(1);
    gonkaAddress = row?.gonkaAddress ?? null;

    if (gonkaAddress) {
      balance = await getBalance(gonkaAddress);
    }
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Wallet</h1>
        <p className="mt-1 text-sm text-slate-600">Custodial Gonka wallet managed by GonkaCloud (mnemonic never shown).</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Wallet Address</CardTitle>
          <CardDescription>Use this address to deposit Gonka tokens.</CardDescription>
        </CardHeader>
        <CardContent>
          <WalletClient address={gonkaAddress} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Balance</CardTitle>
          <CardDescription>On-chain balance for your custodial wallet.</CardDescription>
        </CardHeader>
        <CardContent>
          {gonkaAddress && balance ? (
            <div className="space-y-1">
              <p className="text-3xl font-semibold tracking-tight text-slate-900">{balance.gonka} GONKA</p>
              <p className="font-mono text-xs text-slate-500">{balance.ngonka} ngonka</p>
            </div>
          ) : (
            <p className="text-sm text-slate-600">Wallet not provisioned yet.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Deposit Instructions</CardTitle>
          <CardDescription>Send tokens to your GonkaCloud custodial address.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-700">
          <ol className="list-decimal pl-5">
            <li>Copy your wallet address above.</li>
            <li>Send GONKA to that address from your external wallet/exchange.</li>
            <li>Wait for confirmations, then refresh this page.</li>
          </ol>
          <p className="text-xs text-slate-500">GonkaCloud will never show your mnemonic or private key.</p>
        </CardContent>
      </Card>
    </section>
  );
}
