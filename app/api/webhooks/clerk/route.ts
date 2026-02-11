import { WebhookEvent } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "svix";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { generateWallet } from "@/lib/wallet/gonka";

function getPrimaryEmail(event: WebhookEvent): string | null {
  if (event.type !== "user.created") {
    return null;
  }

  const emails = event.data.email_addresses;
  const primaryEmailId = event.data.primary_email_address_id;

  const primary = emails.find((email) => email.id === primaryEmailId) ?? emails[0];

  return primary?.email_address ?? null;
}

export async function POST(req: Request) {
  console.log("[clerk-webhook] received request");
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("[clerk-webhook] missing CLERK_WEBHOOK_SECRET");
    return NextResponse.json({ error: "Missing CLERK_WEBHOOK_SECRET" }, { status: 500 });
  }

  const headerPayload = headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    console.error("[clerk-webhook] missing svix headers", {
      hasId: Boolean(svixId),
      hasTimestamp: Boolean(svixTimestamp),
      hasSignature: Boolean(svixSignature),
    });
    return NextResponse.json({ error: "Missing Svix headers" }, { status: 400 });
  }

  const payload = await req.text();

  let event: WebhookEvent;

  try {
    const webhook = new Webhook(webhookSecret);
    event = webhook.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch {
    console.error("[clerk-webhook] invalid signature", { svixId });
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  console.log("[clerk-webhook] verified event", {
    type: event.type,
    clerkUserId: event.type.startsWith("user.") ? event.data.id : null,
  });

  if (event.type === "user.created") {
    const email = getPrimaryEmail(event);

    if (!email) {
      console.error("[clerk-webhook] missing email for user.created", { clerkUserId: event.data.id });
      return NextResponse.json({ error: "Missing email in payload" }, { status: 400 });
    }

    console.log("[clerk-webhook] upserting user", { clerkUserId: event.data.id, email });
    await db
      .insert(users)
      .values({
        clerkId: event.data.id,
        email,
        balanceUsd: "0.00",
      })
      .onConflictDoUpdate({
        target: users.clerkId,
        set: {
          email,
        },
        setWhere: eq(users.clerkId, event.data.id),
      });

    const [dbUser] = await db
      .select({ id: users.id, gonkaAddress: users.gonkaAddress })
      .from(users)
      .where(eq(users.clerkId, event.data.id))
      .limit(1);

    if (!dbUser) {
      console.error("[clerk-webhook] user provisioning failed after upsert", { clerkUserId: event.data.id });
      return NextResponse.json({ error: "User provisioning failed" }, { status: 500 });
    }

    // Provision custodial Gonka wallet if not already present.
    if (!dbUser.gonkaAddress) {
      console.log("[clerk-webhook] generating wallet", { userId: dbUser.id, clerkUserId: event.data.id });
      try {
        const wallet = await generateWallet();
        console.log("[clerk-webhook] wallet generated", { userId: dbUser.id, address: wallet.address });

        await db
          .update(users)
          .set({
            gonkaAddress: wallet.address,
            gonkaPubkey: wallet.pubkey,
            encryptedMnemonic: wallet.encryptedMnemonic,
          })
          .where(eq(users.id, dbUser.id));
        console.log("[clerk-webhook] wallet stored", { userId: dbUser.id, address: wallet.address });
      } catch (error) {
        console.error("[clerk-webhook] wallet provisioning failed", {
          userId: dbUser.id,
          clerkUserId: event.data.id,
          error: error instanceof Error ? error.message : String(error),
        });
        // Return 500 so Clerk retries; we never want to create a wallet without KMS protection.
        return NextResponse.json({ error: "Wallet provisioning failed" }, { status: 500 });
      }
    } else {
      console.log("[clerk-webhook] wallet already exists, skipping generation", { userId: dbUser.id, address: dbUser.gonkaAddress });
    }
  }

  console.log("[clerk-webhook] completed successfully");
  return NextResponse.json({ ok: true }, { status: 200 });
}
