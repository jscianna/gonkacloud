import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { requireAuth, UnauthorizedError } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getStripe } from "@/lib/stripe";

const PRICE_ID = process.env.STRIPE_API_SUBSCRIPTION_PRICE_ID;

export async function POST(req: Request) {
  try {
    if (!PRICE_ID) {
      console.error("STRIPE_API_SUBSCRIPTION_PRICE_ID not set");
      return NextResponse.json({ error: "Subscription not configured" }, { status: 500 });
    }

    const clerkId = await requireAuth();

    const [dbUser] = await db
      .select({
        id: users.id,
        email: users.email,
        stripeCustomerId: users.stripeCustomerId,
      })
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1);

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 400 });
    }

    const stripe = getStripe();

    // Get or create Stripe customer
    let customerId = dbUser.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: dbUser.email,
        metadata: { userId: dbUser.id },
      });

      customerId = customer.id;

      await db.update(users).set({ stripeCustomerId: customerId }).where(eq(users.id, dbUser.id));
    }

    const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [
        {
          price: PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${origin}/dashboard/billing?success=true`,
      cancel_url: `${origin}/dashboard/billing`,
      metadata: { userId: dbUser.id },
    });

    if (!session.url) {
      return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
    }

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (error) {
    console.error("Subscribe error:", error);
    
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to start subscription" }, { status: 500 });
  }
}
