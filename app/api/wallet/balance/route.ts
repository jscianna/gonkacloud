import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { UnauthorizedError, requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getBalance } from "@/lib/wallet/gonka";

export async function GET() {
  try {
    const clerkId = await requireAuth();

    const [dbUser] = await db
      .select({ id: users.id, gonkaAddress: users.gonkaAddress })
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
    return NextResponse.json({ address: dbUser.gonkaAddress, balance }, { status: 200 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to fetch wallet balance" }, { status: 500 });
  }
}
