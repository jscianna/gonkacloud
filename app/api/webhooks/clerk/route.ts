import { WebhookEvent } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "svix";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

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
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
