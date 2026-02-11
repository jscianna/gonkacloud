import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "svix";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { generateWallet } from "@/lib/wallet/gonka";

type ClerkUserCreatedPayload = {
  id: string;
  email_addresses?: Array<{ email_address?: string | null }>;
};

type ClerkWebhookEvent = {
  type: string;
  data: ClerkUserCreatedPayload;
};

export async function POST(req: Request) {
  console.log("=== CLERK WEBHOOK RECEIVED ===");

  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    console.error("CLERK_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Server config error" }, { status: 500 });
  }

  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error("Missing svix headers");
    return NextResponse.json({ error: "Missing headers" }, { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: ClerkWebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as ClerkWebhookEvent;
    console.log("Webhook verified, event type:", evt.type);
  } catch (err) {
    console.error("Webhook verification failed:", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (evt.type === "user.created") {
    const clerkId = evt.data.id;
    const email = evt.data.email_addresses?.[0]?.email_address || "";
    console.log("Creating user:", clerkId, email);

    try {
      console.log("Generating wallet...");
      const wallet = await generateWallet();
      console.log("Wallet generated:", wallet.address);

      await db
        .insert(users)
        .values({
          clerkId,
          email,
          balanceUsd: "0.00",
          gonkaAddress: wallet.address,
          gonkaPubkey: wallet.pubkey,
          encryptedMnemonic: wallet.encryptedMnemonic,
        })
        .onConflictDoUpdate({
          target: users.clerkId,
          set: {
            email,
            balanceUsd: "0.00",
            gonkaAddress: wallet.address,
            gonkaPubkey: wallet.pubkey,
            encryptedMnemonic: wallet.encryptedMnemonic,
          },
        });

      console.log("User created with wallet");
    } catch (err) {
      console.error("Error creating user:", err instanceof Error ? err.message : String(err));
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Failed to create user and wallet" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ received: true });
}
