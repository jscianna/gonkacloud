/**
 * Subscription provisioning - simplified for shared wallet architecture
 * Just manages subscription records and token allowances
 */

import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { apiSubscriptions, users } from "@/lib/db/schema";

// 100M tokens per month
const TOKENS_PER_SUBSCRIPTION = 100_000_000n;

export interface ProvisionResult {
  success: boolean;
  error?: string;
}

/**
 * Provision a new subscriber - create subscription record with token allowance
 */
export async function provisionSubscriber(
  userId: string,
  stripeSubscriptionId: string,
  stripePriceId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<ProvisionResult> {
  try {
    // Verify user exists
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Check for existing subscription (free tier or same stripe subscription)
    const existingSub = await db
      .select()
      .from(apiSubscriptions)
      .where(eq(apiSubscriptions.userId, userId))
      .limit(1);

    if (existingSub.length > 0) {
      // Upgrade existing subscription (from free tier or update existing paid)
      await db
        .update(apiSubscriptions)
        .set({
          stripeSubscriptionId,
          stripePriceId,
          status: "active",
          tokensAllocated: TOKENS_PER_SUBSCRIPTION,
          tokensUsed: 0n, // Reset on new subscription
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          updatedAt: new Date(),
        })
        .where(eq(apiSubscriptions.id, existingSub[0].id));
      
      console.log(`[provision] Upgraded subscription for user ${userId} (was: ${existingSub[0].status})`);
    } else {
      // Create new subscription (shouldn't happen if Clerk webhook worked, but just in case)
      await db.insert(apiSubscriptions).values({
        userId,
        stripeSubscriptionId,
        stripePriceId,
        status: "active",
        tokensAllocated: TOKENS_PER_SUBSCRIPTION,
        tokensUsed: 0n,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
      });
    }

    console.log(`[provision] Activated subscription for user ${userId}`);
    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.error(`[provision] Failed:`, error);
    return { success: false, error: errorMsg };
  }
}

/**
 * Top up tokens for subscription renewal - reset usage counter
 */
export async function topUpSubscription(
  stripeSubscriptionId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<ProvisionResult> {
  try {
    const [subscription] = await db
      .select()
      .from(apiSubscriptions)
      .where(eq(apiSubscriptions.stripeSubscriptionId, stripeSubscriptionId))
      .limit(1);

    if (!subscription) {
      return { success: false, error: "Subscription not found" };
    }

    // Reset tokens for new period
    await db
      .update(apiSubscriptions)
      .set({
        tokensAllocated: TOKENS_PER_SUBSCRIPTION,
        tokensUsed: 0n, // Reset usage
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        updatedAt: new Date(),
      })
      .where(eq(apiSubscriptions.id, subscription.id));

    console.log(`[topup] Reset tokens for subscription ${stripeSubscriptionId}`);
    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.error(`[topup] Failed:`, error);
    return { success: false, error: errorMsg };
  }
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(stripeSubscriptionId: string): Promise<void> {
  await db
    .update(apiSubscriptions)
    .set({
      status: "canceled",
      canceledAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(apiSubscriptions.stripeSubscriptionId, stripeSubscriptionId));
}
