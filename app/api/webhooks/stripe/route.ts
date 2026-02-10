import { eq, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";

import { db } from "@/lib/db";
import { transactions, users } from "@/lib/db/schema";
import { getStripe } from "@/lib/stripe";

function centsToUsdString(cents: number) {
  return (cents / 100).toFixed(2);
}

export async function POST(req: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json({ error: "Missing STRIPE_WEBHOOK_SECRET" }, { status: 500 });
  }

  const signature = headers().get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  const payload = await req.text();

  let event: Stripe.Event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const amountTotal = session.amount_total;
    const userId = session.client_reference_id ?? session.metadata?.userId;

    if (!amountTotal || amountTotal <= 0 || !userId) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const stripePaymentId =
      (typeof session.payment_intent === "string" ? session.payment_intent : null) ?? session.id ?? null;

    // Idempotency: if we already recorded this payment, do nothing.
    if (stripePaymentId) {
      const [existing] = await db
        .select({ id: transactions.id })
        .from(transactions)
        .where(eq(transactions.stripePaymentId, stripePaymentId))
        .limit(1);

      if (existing) {
        return NextResponse.json({ ok: true }, { status: 200 });
      }
    }

    const amountUsd = centsToUsdString(amountTotal);

    // Atomically add credits.
    const [updated] = await db
      .update(users)
      .set({
        balanceUsd: sql`${users.balanceUsd} + ${amountUsd}::numeric`,
      })
      .where(eq(users.id, userId))
      .returning({ balanceUsd: users.balanceUsd });

    if (!updated) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    await db.insert(transactions).values({
      userId,
      type: "purchase",
      amountUsd,
      balanceAfterUsd: updated.balanceUsd,
      stripePaymentId,
    });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
