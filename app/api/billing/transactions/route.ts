import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { requireAuth, UnauthorizedError } from "@/lib/auth";
import { db } from "@/lib/db";
import { transactions, users } from "@/lib/db/schema";

function typeDelta(type: string, amount: number) {
  const t = type.toLowerCase();
  if (t === "purchase") return amount;
  if (t === "refund") return amount;
  if (t === "usage") return -amount;
  return 0;
}

export async function GET() {
  try {
    const clerkId = await requireAuth();

    const [dbUser] = await db
      .select({ id: users.id, balanceUsd: users.balanceUsd })
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1);

    if (!dbUser) {
      return NextResponse.json({ transactions: [] }, { status: 200 });
    }

    const rows = await db
      .select({
        id: transactions.id,
        type: transactions.type,
        amountUsd: transactions.amountUsd,
        createdAt: transactions.createdAt,
      })
      .from(transactions)
      .where(eq(transactions.userId, dbUser.id))
      .orderBy(desc(transactions.createdAt));

    // Compute running balance backwards from current balance.
    let running = Number.parseFloat(dbUser.balanceUsd ?? "0");
    if (!Number.isFinite(running)) running = 0;

    const withBalance = rows.map((row, idx) => {
      const amount = Number.parseFloat(row.amountUsd);
      const safeAmount = Number.isFinite(amount) ? amount : 0;

      const balanceAfter = running;
      const delta = typeDelta(row.type, safeAmount);

      // Next (older) transaction balance after = current - delta of current.
      running = running - delta;

      return {
        id: row.id,
        type: row.type,
        amountUsd: row.amountUsd,
        createdAt: row.createdAt.toISOString(),
        balanceAfterUsd: balanceAfter.toFixed(2),
        index: idx,
      };
    });

    return NextResponse.json({ transactions: withBalance }, { status: 200 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}
