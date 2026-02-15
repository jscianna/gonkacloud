import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { requireAuth, UnauthorizedError } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getStripe } from "@/lib/stripe";

export async function POST(req: Request) {
  try {
    const clerkId = await requireAuth();

    const [dbUser] = await db
      .select({
        id: users.id,
        stripeCustomerId: users.stripeCustomerId,
      })
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1);

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 400 });
    }

    if (!dbUser.stripeCustomerId) {
      return NextResponse.json({ error: "No subscription found" }, { status: 400 });
    }

    const stripe = getStripe();
    const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;

    const session = await stripe.billingPortal.sessions.create({
      customer: dbUser.stripeCustomerId,
      return_url: `${origin}/chat`,
    });

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (error) {
    console.error("Portal error:", error);

    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to open billing portal" }, { status: 500 });
  }
}
