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
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json({ error: "Missing CLERK_WEBHOOK_SECRET" }, { status: 500 });
  }

  const headerPayload = headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
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
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  if (event.type === "user.created") {
    const email = getPrimaryEmail(event);

    if (!email) {
      return NextResponse.json({ error: "Missing email in payload" }, { status: 400 });
    }

    await db
      .insert(users)
      .values({
        clerkId: event.data.id,
        email,
        balanceUsd: "5.00",
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
      return NextResponse.json({ error: "User provisioning failed" }, { status: 500 });
    }

    // Provision custodial Gonka wallet if not already present.
    if (!dbUser.gonkaAddress) {
      try {
        const wallet = await generateWallet();

        await db
          .update(users)
          .set({
            gonkaAddress: wallet.address,
            gonkaPubkey: wallet.pubkey,
            encryptedMnemonic: wallet.encryptedMnemonic,
          })
          .where(eq(users.id, dbUser.id));
      } catch {
        // Return 500 so Clerk retries; we never want to create a wallet without KMS protection.
        return NextResponse.json({ error: "Wallet provisioning failed" }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
