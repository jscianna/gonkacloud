import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { requireAuth, UnauthorizedError } from "@/lib/auth";
import { db } from "@/lib/db";
import { transactions, users } from "@/lib/db/schema";

export async function GET() {
  try {
    const clerkId = await requireAuth();

    const [dbUser] = await db
      .select({ id: users.id })
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

    const formatted = rows.map((row) => ({
      id: row.id,
      type: row.type,
      amountUsd: row.amountUsd,
      createdAt: row.createdAt.toISOString(),
    }));

    return NextResponse.json({ transactions: formatted }, { status: 200 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}
