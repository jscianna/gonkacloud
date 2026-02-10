import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { requireAuth, UnauthorizedError } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getStripe } from "@/lib/stripe";

function toCents(amountUsd: number) {
  return Math.round(amountUsd * 100);
}

export async function POST(req: Request) {
  try {
    const clerkId = await requireAuth();
    const body = (await req.json().catch(() => null)) as { amount?: number } | null;

    const amount = Number(body?.amount);

    if (!Number.isFinite(amount) || amount < 5 || amount > 500) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const amountCents = toCents(amount);
    if (!Number.isInteger(amountCents) || amountCents < 500 || amountCents > 50000) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

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
      return NextResponse.json({ error: "User not provisioned" }, { status: 400 });
    }

    const stripe = getStripe();

    let customerId = dbUser.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: dbUser.email,
        metadata: {
          userId: dbUser.id,
        },
      });

      customerId = customer.id;

      await db.update(users).set({ stripeCustomerId: customerId }).where(eq(users.id, dbUser.id));
    }

    const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: customerId,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: amountCents,
            product_data: {
              name: "GonkaCloud Credits",
              description: "Prepaid credits for AI inference",
            },
          },
        },
      ],
      success_url: `${origin}/dashboard/billing?success=true`,
      cancel_url: `${origin}/dashboard/billing`,
      client_reference_id: dbUser.id,
      metadata: {
        userId: dbUser.id,
      },
    });

    if (!session.url) {
      return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
    }

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
