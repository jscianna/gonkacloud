import { NextResponse } from "next/server";
import { eq, and, sql } from "drizzle-orm";

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiSubscriptions } from "@/lib/db/schema";

export async function GET() {
  try {
    const user = await getCurrentUser();
    
    if (!user?.dbUser?.id) {
      return NextResponse.json({
        status: "none",
        tokensAllocated: 0,
        tokensUsed: 0,
        tokensRemaining: 0,
        currentPeriodEnd: null,
        email: "",
      });
    }

    const email = user.clerkUser?.emailAddresses[0]?.emailAddress ?? "";

    const subscription = await db.query.apiSubscriptions.findFirst({
      where: and(
        eq(apiSubscriptions.userId, user.dbUser.id),
        sql`${apiSubscriptions.status} IN ('active', 'free')`
      ),
    });

    if (!subscription) {
      return NextResponse.json({
        status: "none",
        tokensAllocated: 0,
        tokensUsed: 0,
        tokensRemaining: 0,
        currentPeriodEnd: null,
        email,
      });
    }

    const tokensAllocated = Number(subscription.tokensAllocated ?? 0);
    const tokensUsed = Number(subscription.tokensUsed ?? 0);
    const tokensRemaining = Math.max(0, tokensAllocated - tokensUsed);

    return NextResponse.json({
      status: subscription.status,
      tokensAllocated,
      tokensUsed,
      tokensRemaining,
      currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
      email,
    });
  } catch (error) {
    console.error("Failed to get subscription:", error);
    return NextResponse.json({
      status: "none",
      tokensAllocated: 0,
      tokensUsed: 0,
      tokensRemaining: 0,
      currentPeriodEnd: null,
      email: "",
    });
  }
}
