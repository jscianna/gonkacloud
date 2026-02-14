import { eq, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";

import { db } from "@/lib/db";
import { transactions, users } from "@/lib/db/schema";
import { getStripe } from "@/lib/stripe";
import { cancelSubscription, provisionSubscriber, topUpSubscription } from "@/lib/subscription/provision";

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

  console.log(`[stripe-webhook] Received event: ${event.type}`);

  try {
    switch (event.type) {
      // One-time payment completed (credit purchase)
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // Check if this is a subscription or one-time payment
        if (session.mode === "subscription") {
          // Subscription - handled by customer.subscription.created
          console.log(`[stripe-webhook] Subscription checkout completed, subscription will be handled separately`);
        } else {
          // One-time credit purchase
          await handleCreditPurchase(session);
        }
        break;
      }

      // Subscription created (new subscriber)
      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCreated(subscription);
        break;
      }

      // Invoice paid (initial or renewal)
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }

      // Subscription canceled
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCanceled(subscription);
        break;
      }

      // Subscription updated (plan change, etc.)
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      // Payment failed
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`[stripe-webhook] Payment failed for subscription ${invoice.subscription}`);
        // Could send email notification here
        break;
      }

      default:
        console.log(`[stripe-webhook] Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error(`[stripe-webhook] Error handling ${event.type}:`, error);
    // Return 200 to prevent Stripe from retrying
    // The error is logged and can be investigated
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}

async function handleCreditPurchase(session: Stripe.Checkout.Session) {
  const amountTotal = session.amount_total;
  const userId = session.client_reference_id ?? session.metadata?.userId;

  if (!amountTotal || amountTotal <= 0 || !userId) {
    console.log(`[stripe-webhook] Skipping credit purchase: missing amount or userId`);
    return;
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
      console.log(`[stripe-webhook] Payment ${stripePaymentId} already recorded`);
      return;
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
    console.log(`[stripe-webhook] User ${userId} not found for credit purchase`);
    return;
  }

  await db.insert(transactions).values({
    userId,
    type: "purchase",
    amountUsd,
    balanceAfterUsd: updated.balanceUsd,
    stripePaymentId,
  });

  console.log(`[stripe-webhook] Added ${amountUsd} credits to user ${userId}`);
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const customerId = typeof subscription.customer === "string" 
    ? subscription.customer 
    : subscription.customer.id;
  
  // Find user by Stripe customer ID
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.stripeCustomerId, customerId))
    .limit(1);

  if (!user) {
    console.log(`[stripe-webhook] User not found for customer ${customerId}`);
    return;
  }

  const priceId = subscription.items.data[0]?.price.id;
  const periodStart = new Date(subscription.current_period_start * 1000);
  const periodEnd = new Date(subscription.current_period_end * 1000);

  console.log(`[stripe-webhook] Provisioning subscription ${subscription.id} for user ${user.id}`);
  
  const result = await provisionSubscriber(
    user.id,
    subscription.id,
    priceId || "",
    periodStart,
    periodEnd
  );

  if (result.success) {
    console.log(`[stripe-webhook] Successfully provisioned: address=${result.gonkaAddress}, txHash=${result.txHash}`);
  } else {
    console.error(`[stripe-webhook] Provision failed: ${result.error}`);
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const subscriptionId = typeof invoice.subscription === "string" 
    ? invoice.subscription 
    : invoice.subscription?.id;

  if (!subscriptionId) {
    console.log(`[stripe-webhook] Invoice ${invoice.id} has no subscription`);
    return;
  }

  // Check if this is the first invoice (subscription creation) or a renewal
  const billingReason = invoice.billing_reason;
  
  if (billingReason === "subscription_create") {
    // First invoice - subscription was just created, provisioning handled by subscription.created
    console.log(`[stripe-webhook] First invoice for subscription ${subscriptionId}, skipping (handled by subscription.created)`);
    return;
  }

  if (billingReason === "subscription_cycle") {
    // Renewal - top up tokens
    const periodStart = invoice.period_start ? new Date(invoice.period_start * 1000) : new Date();
    const periodEnd = invoice.period_end ? new Date(invoice.period_end * 1000) : new Date();

    console.log(`[stripe-webhook] Renewal for subscription ${subscriptionId}`);
    
    const result = await topUpSubscription(subscriptionId, periodStart, periodEnd);
    
    if (result.success) {
      console.log(`[stripe-webhook] Top-up successful: txHash=${result.txHash}`);
    } else {
      console.error(`[stripe-webhook] Top-up failed: ${result.error}`);
    }
  }
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  console.log(`[stripe-webhook] Canceling subscription ${subscription.id}`);
  await cancelSubscription(subscription.id);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const status = subscription.status;
  
  if (status === "past_due" || status === "unpaid") {
    console.log(`[stripe-webhook] Subscription ${subscription.id} is ${status}`);
    // Could disable API access here
  }
  
  if (status === "active") {
    console.log(`[stripe-webhook] Subscription ${subscription.id} is now active`);
  }
}
