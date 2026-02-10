import { desc, eq } from "drizzle-orm";

import { BillingClient } from "@/components/dashboard/billing-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { transactions } from "@/lib/db/schema";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(value: Date) {
  return value.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function typeStyles(type: string) {
  const t = type.toLowerCase();
  if (t === "purchase") return "text-emerald-700";
  if (t === "usage") return "text-rose-700";
  if (t === "refund") return "text-sky-700";
  return "text-slate-700";
}

function typeDelta(type: string, amount: number) {
  const t = type.toLowerCase();
  if (t === "purchase") return amount;
  if (t === "refund") return amount;
  if (t === "usage") return -amount;
  return 0;
}

export default async function BillingPage() {
  const user = await getCurrentUser();

  const email = user?.clerkUser?.emailAddresses[0]?.emailAddress ?? user?.dbUser?.email ?? "";
  const balance = Number.parseFloat(user?.dbUser?.balanceUsd ?? "0");
  const safeBalance = Number.isFinite(balance) ? balance : 0;

  const rows = user?.dbUser?.id
    ? await db
        .select({
          id: transactions.id,
          type: transactions.type,
          amountUsd: transactions.amountUsd,
          createdAt: transactions.createdAt,
        })
        .from(transactions)
        .where(eq(transactions.userId, user.dbUser.id))
        .orderBy(desc(transactions.createdAt))
    : [];

  // Running balance backwards from current.
  let running = safeBalance;
  const history = rows.map((row) => {
    const amount = Number.parseFloat(row.amountUsd);
    const safeAmount = Number.isFinite(amount) ? amount : 0;

    const balanceAfter = running;
    const delta = typeDelta(row.type, safeAmount);
    running = running - delta;

    return {
      ...row,
      balanceAfter,
      amount: safeAmount,
    };
  });

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Billing</h1>
        <p className="mt-1 text-sm text-slate-600">Manage credits and view transaction history{email ? ` for ${email}` : ""}.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardDescription>Current Balance</CardDescription>
            <CardTitle className="text-4xl text-slate-900">{formatCurrency(safeBalance)}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Add Credits</CardTitle>
            <CardDescription>Purchase prepaid credits to use across the API and chat.</CardDescription>
          </CardHeader>
          <CardContent>
            <BillingClient />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Date | Type | Amount | Balance After</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Balance After</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-sm text-slate-500">
                    No transactions yet.
                  </TableCell>
                </TableRow>
              ) : (
                history.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{formatDate(row.createdAt)}</TableCell>
                    <TableCell className={typeStyles(row.type)}>{row.type}</TableCell>
                    <TableCell>{formatCurrency(row.amount)}</TableCell>
                    <TableCell>{formatCurrency(row.balanceAfter)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>
  );
}
