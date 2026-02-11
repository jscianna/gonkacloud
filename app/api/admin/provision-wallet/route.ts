import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { generateWallet } from "@/lib/wallet/gonka";

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [user] = await db.select().from(users).where(eq(users.clerkId, userId)).limit(1);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (user.gonkaAddress) {
    return NextResponse.json({ address: user.gonkaAddress, exists: true });
  }

  try {
    const wallet = await generateWallet();

    await db
      .update(users)
      .set({
        gonkaAddress: wallet.address,
        gonkaPubkey: wallet.pubkey,
        encryptedMnemonic: wallet.encryptedMnemonic,
      })
      .where(eq(users.clerkId, userId));

    return NextResponse.json({ address: wallet.address, provisioned: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Wallet provisioning failed" },
      { status: 500 }
    );
  }
}
