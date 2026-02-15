import crypto from "crypto";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

import { UnauthorizedError, requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiKeys, users, apiSubscriptions } from "@/lib/db/schema";

// Free tier tokens
const FREE_TIER_TOKENS = 1_000_000n;

function sha256Hex(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function generateApiKey() {
  // 36 bytes -> 48 chars in base64url (no padding)
  const rand = crypto.randomBytes(36).toString("base64url");
  return `sk-gc-${rand}`;
}

export async function GET() {
  try {
    const clerkId = await requireAuth();
    console.log("[api/keys][GET] request", { clerkId });

    const [dbUser] = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, clerkId)).limit(1);

    if (!dbUser) {
      console.log("[api/keys][GET] no provisioned db user", { clerkId });
      return NextResponse.json({ keys: [] }, { status: 200 });
    }

    const keys = await db
      .select({
        id: apiKeys.id,
        name: apiKeys.name,
        keyPrefix: apiKeys.keyPrefix,
        createdAt: apiKeys.createdAt,
        lastUsedAt: apiKeys.lastUsedAt,
        revokedAt: apiKeys.revokedAt,
      })
      .from(apiKeys)
      .where(eq(apiKeys.userId, dbUser.id))
      .orderBy(desc(apiKeys.createdAt));

    return NextResponse.json({ keys }, { status: 200 });
  } catch (error) {
    console.error("[api/keys][GET] error", error);
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to list keys" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const clerkId = await requireAuth();
    console.log("[api/keys][POST] request", { clerkId });

    const body = (await req.json().catch(() => null)) as { name?: string } | null;
    const name = (body?.name ?? "").trim();
    console.log("[api/keys][POST] payload parsed", { hasBody: Boolean(body), nameLength: name.length });

    if (!name || name.length > 120) {
      console.warn("[api/keys][POST] invalid name", { nameLength: name.length });
      return NextResponse.json({ error: "Invalid name" }, { status: 400 });
    }

    let [dbUser] = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, clerkId)).limit(1);

    // Auto-provision user if Clerk webhook didn't fire (fallback)
    if (!dbUser) {
      console.log("[api/keys][POST] Auto-provisioning user:", clerkId);
      const { currentUser } = await import("@clerk/nextjs/server");
      const clerkUser = await currentUser();
      const email = clerkUser?.emailAddresses?.[0]?.emailAddress || `${clerkId}@temp.local`;
      
      const userId = crypto.randomUUID();
      await db.insert(users).values({
        id: userId,
        clerkId,
        email,
      }).onConflictDoNothing();
      
      // Create free tier subscription (1M tokens)
      await db.insert(apiSubscriptions).values({
        userId,
        status: "free",
        tokensAllocated: FREE_TIER_TOKENS,
        tokensUsed: 0n,
      }).onConflictDoNothing();
      
      dbUser = { id: userId };
      console.log("[api/keys][POST] User auto-provisioned:", userId);
    }

    const fullKey = generateApiKey();
    const keyHash = sha256Hex(fullKey);
    const keyPrefix = fullKey.slice(0, 12);

    const [created] = await db
      .insert(apiKeys)
      .values({
        userId: dbUser.id,
        name,
        keyHash,
        keyPrefix,
      })
      .returning({
        id: apiKeys.id,
        name: apiKeys.name,
        keyPrefix: apiKeys.keyPrefix,
        createdAt: apiKeys.createdAt,
        lastUsedAt: apiKeys.lastUsedAt,
        revokedAt: apiKeys.revokedAt,
      });

    console.log("[api/keys][POST] key created", { userId: dbUser.id, apiKeyId: created?.id });
    return NextResponse.json({
      key: fullKey,
      apiKey: created,
    });
  } catch (error) {
    console.error("[api/keys][POST] error", error);
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to create key" }, { status: 500 });
  }
}
