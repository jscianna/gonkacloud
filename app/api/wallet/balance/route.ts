import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { UnauthorizedError, requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { formatGonkaBalance, getGonkaBalance } from "@/lib/gonka/balance";
import { getBalance } from "@/lib/wallet/gonka";

export async function GET() {
  try {
    const clerkId = await requireAuth();

    const [dbUser] = await db
      .select({
        id: users.id,
        gonkaAddress: users.gonkaAddress,
        inferenceRegistered: users.inferenceRegistered,
        inferenceRegisteredAt: users.inferenceRegisteredAt,
      })
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1);

    if (!dbUser) {
      return NextResponse.json({ error: "User not provisioned" }, { status: 400 });
    }

    if (!dbUser.gonkaAddress) {
      return NextResponse.json({ error: "Wallet not provisioned" }, { status: 400 });
    }

    const balance = await getBalance(dbUser.gonkaAddress);
    const gnkRaw = await getGonkaBalance(dbUser.gonkaAddress);
    return NextResponse.json(
      {
        address: dbUser.gonkaAddress,
        balance,
        gnkBalanceRaw: gnkRaw,
        gnkBalanceFormatted: formatGonkaBalance(gnkRaw),
        inferenceRegistered: dbUser.inferenceRegistered,
        inferenceRegisteredAt: dbUser.inferenceRegisteredAt,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to fetch wallet balance" }, { status: 500 });
  }
}
