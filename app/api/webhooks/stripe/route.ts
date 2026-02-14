import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getStripe } from "@/lib/stripe";
import { cancelSubscription, provisionSubscriber, topUpSubscription } from "@/lib/subscription/provision";

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
      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCreated(subscription);
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCanceled(subscription);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const subId = (invoice as { subscription?: string | { id: string } }).subscription;
        const subscriptionId = typeof subId === "string" ? subId : subId?.id;
        console.log(`[stripe-webhook] Payment failed for subscription ${subscriptionId}`);
        break;
      }

      default:
        console.log(`[stripe-webhook] Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error(`[stripe-webhook] Error handling ${event.type}:`, error);
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const customerId = typeof subscription.customer === "string" 
    ? subscription.customer 
    : subscription.customer.id;
  
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
  const sub = subscription as unknown as { current_period_start?: number; current_period_end?: number };
  const periodStart = new Date((sub.current_period_start ?? 0) * 1000);
  const periodEnd = new Date((sub.current_period_end ?? 0) * 1000);

  console.log(`[stripe-webhook] Provisioning subscription ${subscription.id} for user ${user.id}`);
  
  const result = await provisionSubscriber(
    user.id,
    subscription.id,
    priceId || "",
    periodStart,
    periodEnd
  );

  if (result.success) {
    console.log(`[stripe-webhook] Successfully provisioned subscription for user ${user.id}`);
  } else {
    console.error(`[stripe-webhook] Provision failed: ${result.error}`);
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const inv = invoice as unknown as { subscription?: string | { id: string }; billing_reason?: string; period_start?: number; period_end?: number };
  const subscriptionId = typeof inv.subscription === "string" 
    ? inv.subscription 
    : inv.subscription?.id;

  if (!subscriptionId) {
    console.log(`[stripe-webhook] Invoice ${invoice.id} has no subscription`);
    return;
  }

  const billingReason = inv.billing_reason;
  
  if (billingReason === "subscription_create") {
    console.log(`[stripe-webhook] First invoice for subscription ${subscriptionId}, skipping`);
    return;
  }

  if (billingReason === "subscription_cycle") {
    const periodStart = inv.period_start ? new Date(inv.period_start * 1000) : new Date();
    const periodEnd = inv.period_end ? new Date(inv.period_end * 1000) : new Date();

    console.log(`[stripe-webhook] Renewal for subscription ${subscriptionId}`);
    
    const result = await topUpSubscription(subscriptionId, periodStart, periodEnd);
    
    if (result.success) {
      console.log(`[stripe-webhook] Token reset successful for subscription ${subscriptionId}`);
    } else {
      console.error(`[stripe-webhook] Token reset failed: ${result.error}`);
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
  }
  
  if (status === "active") {
    console.log(`[stripe-webhook] Subscription ${subscription.id} is now active`);
  }
}
