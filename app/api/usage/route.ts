import { and, eq, gte, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import { UnauthorizedError, requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { usageLogs, users } from "@/lib/db/schema";

type RawUsageRow = {
  day: string;
  calls: number;
  tokens: number;
};

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export async function GET() {
  try {
    const clerkId = await requireAuth();

    const [dbUser] = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, clerkId)).limit(1);

    if (!dbUser) {
      return NextResponse.json({ data: [] }, { status: 200 });
    }

    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - 6);

    const rows = await db
      .select({
        day: sql<string>`to_char(date_trunc('day', ${usageLogs.createdAt}), 'YYYY-MM-DD')`,
        calls: sql<number>`COUNT(*)::int`,
        tokens: sql<number>`COALESCE(SUM(${usageLogs.promptTokens} + ${usageLogs.completionTokens}), 0)::int`,
      })
      .from(usageLogs)
      .where(and(eq(usageLogs.userId, dbUser.id), gte(usageLogs.createdAt, startDate)))
      .groupBy(sql`date_trunc('day', ${usageLogs.createdAt})`)
      .orderBy(sql`date_trunc('day', ${usageLogs.createdAt})`);

    const usageByDay = new Map<string, RawUsageRow>();

    for (const row of rows) {
      usageByDay.set(row.day, {
        day: row.day,
        calls: Number(row.calls ?? 0),
        tokens: Number(row.tokens ?? 0),
      });
    }

    const data = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + index);

      const iso = toIsoDate(date);
      const label = date.toLocaleDateString("en-US", { weekday: "short" });
      const row = usageByDay.get(iso);

      return {
        day: label,
        calls: row?.calls ?? 0,
        tokens: row?.tokens ?? 0,
      };
    });

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to fetch usage" }, { status: 500 });
  }
}
