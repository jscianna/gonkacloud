import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { getGonkaBalance } from "@/lib/gonka/balance";
import { createGonkaClient, DEFAULT_GONKA_MODEL } from "@/lib/gonka/client";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json().catch(() => null)) as {
      messages?: Array<Record<string, unknown>>;
      model?: string;
      max_tokens?: number;
      temperature?: number;
      stream?: boolean;
    } | null;

    if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json({ error: "messages are required" }, { status: 400 });
    }

    const [user] = await db
      .select({
        gonkaAddress: users.gonkaAddress,
        encryptedMnemonic: users.encryptedMnemonic,
        inferenceRegistered: users.inferenceRegistered,
      })
      .from(users)
      .where(eq(users.clerkId, userId))
      .limit(1);

    if (!user?.gonkaAddress || !user.encryptedMnemonic) {
      return NextResponse.json({ error: "No Gonka wallet" }, { status: 400 });
    }

    if (!user.inferenceRegistered) {
      return NextResponse.json({ error: "Wallet not registered for inference" }, { status: 400 });
    }

    const gnkBalance = await getGonkaBalance(user.gonkaAddress);
    if (gnkBalance <= 0) {
      return NextResponse.json({ error: "Insufficient GNK balance" }, { status: 402 });
    }

    const client = await createGonkaClient({
      encryptedMnemonic: user.encryptedMnemonic,
      gonkaAddress: user.gonkaAddress,
    });

    const completion = await client.chat.completions.create({
      model: body.model || DEFAULT_GONKA_MODEL,
      messages: body.messages as any,
      max_tokens: typeof body.max_tokens === "number" ? body.max_tokens : 1000,
      temperature: typeof body.temperature === "number" ? body.temperature : undefined,
      stream: false,
    });

    return NextResponse.json(completion, { status: 200 });
  } catch (error: any) {
    if (error?.status === 402) {
      return NextResponse.json({ error: "Insufficient GNK balance" }, { status: 402 });
    }

    return NextResponse.json({ error: "Inference request failed" }, { status: 500 });
  }
}
