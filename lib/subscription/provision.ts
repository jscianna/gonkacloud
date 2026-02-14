/**
 * Subscription provisioning logic
 * Handles creating wallets, sending tokens, and registering for inference
 */

import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { apiSubscriptions, tokenTransfers, users } from "@/lib/db/schema";
import { registerGonkaWallet } from "@/lib/gonka/register";
import { generateWallet, sendTokens } from "@/lib/wallet/gonka";
import { decrypt } from "@/lib/wallet/kms";

// Token amounts (100M tokens = 100 GNK = 100,000,000,000 ngonka)
const TOKENS_PER_SUBSCRIPTION = 100_000_000n; // 100M tokens
const NGONKA_PER_SUBSCRIPTION = "100000000000"; // 100 GNK in ngonka

// Treasury wallet (funded wallet that sends tokens to users)
// This should be set in environment variables
const TREASURY_ENCRYPTED_MNEMONIC = process.env.TREASURY_ENCRYPTED_MNEMONIC;
const TREASURY_ADDRESS = process.env.TREASURY_ADDRESS;

export interface ProvisionResult {
  success: boolean;
  gonkaAddress?: string;
  txHash?: string;
  error?: string;
}

/**
 * Provision a new subscriber:
 * 1. Create wallet if they don't have one
 * 2. Register wallet with Gonka network
 * 3. Send initial tokens from treasury
 * 4. Create/update subscription record
 */
export async function provisionSubscriber(
  userId: string,
  stripeSubscriptionId: string,
  stripePriceId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<ProvisionResult> {
  try {
    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return { success: false, error: "User not found" };
    }

    let gonkaAddress = user.gonkaAddress;
    let encryptedMnemonic = user.encryptedMnemonic;

    // Step 1: Create wallet if needed
    if (!gonkaAddress || !encryptedMnemonic) {
      console.log(`[provision] Creating wallet for user ${userId}`);
      const wallet = await generateWallet();
      gonkaAddress = wallet.address;
      encryptedMnemonic = wallet.encryptedMnemonic;

      await db
        .update(users)
        .set({
          gonkaAddress: wallet.address,
          encryptedMnemonic: wallet.encryptedMnemonic,
          encryptedPrivateKey: wallet.encryptedPrivateKey,
        })
        .where(eq(users.id, userId));
    }

    // Step 2: Register with Gonka network if not already
    if (!user.inferenceRegistered && encryptedMnemonic) {
      console.log(`[provision] Registering wallet ${gonkaAddress} with Gonka network`);
      try {
        await registerGonkaWallet(await decrypt(encryptedMnemonic));
        await db
          .update(users)
          .set({
            inferenceRegistered: true,
            inferenceRegisteredAt: new Date(),
          })
          .where(eq(users.id, userId));
      } catch (regError) {
        console.error(`[provision] Registration failed (may already be registered):`, regError);
        // Continue anyway - might already be registered
      }
    }

    // Step 3: Send tokens from treasury
    let txHash: string | undefined;
    if (TREASURY_ENCRYPTED_MNEMONIC && TREASURY_ADDRESS && gonkaAddress) {
      console.log(`[provision] Sending ${NGONKA_PER_SUBSCRIPTION} ngonka to ${gonkaAddress}`);
      
      // Record pending transfer
      const [transfer] = await db
        .insert(tokenTransfers)
        .values({
          userId,
          fromAddress: TREASURY_ADDRESS,
          toAddress: gonkaAddress,
          amountNgonka: NGONKA_PER_SUBSCRIPTION,
          status: "pending",
        })
        .returning();

      try {
        txHash = await sendTokens(TREASURY_ENCRYPTED_MNEMONIC, gonkaAddress, NGONKA_PER_SUBSCRIPTION);
        
        // Update transfer status
        await db
          .update(tokenTransfers)
          .set({ status: "success", txHash })
          .where(eq(tokenTransfers.id, transfer.id));
      } catch (sendError) {
        const errorMsg = sendError instanceof Error ? sendError.message : "Unknown error";
        console.error(`[provision] Token send failed:`, sendError);
        
        await db
          .update(tokenTransfers)
          .set({ status: "failed", errorMessage: errorMsg })
          .where(eq(tokenTransfers.id, transfer.id));
        
        // Don't fail the whole provision - user can still use the service
        // They just won't have tokens yet
      }
    } else {
      console.warn("[provision] Treasury not configured, skipping token send");
    }

    // Step 4: Create/update subscription record
    const existingSub = await db
      .select()
      .from(apiSubscriptions)
      .where(eq(apiSubscriptions.stripeSubscriptionId, stripeSubscriptionId))
      .limit(1);

    if (existingSub.length > 0) {
      // Update existing subscription
      await db
        .update(apiSubscriptions)
        .set({
          status: "active",
          tokensAllocated: existingSub[0].tokensAllocated + TOKENS_PER_SUBSCRIPTION,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          updatedAt: new Date(),
        })
        .where(eq(apiSubscriptions.stripeSubscriptionId, stripeSubscriptionId));
    } else {
      // Create new subscription
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

    console.log(`[provision] Successfully provisioned user ${userId} with address ${gonkaAddress}`);
    
    return {
      success: true,
      gonkaAddress: gonkaAddress || undefined,
      txHash,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.error(`[provision] Failed:`, error);
    return { success: false, error: errorMsg };
  }
}

/**
 * Top up tokens for subscription renewal
 */
export async function topUpSubscription(
  stripeSubscriptionId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<ProvisionResult> {
  try {
    // Find subscription
    const [subscription] = await db
      .select()
      .from(apiSubscriptions)
      .where(eq(apiSubscriptions.stripeSubscriptionId, stripeSubscriptionId))
      .limit(1);

    if (!subscription) {
      return { success: false, error: "Subscription not found" };
    }

    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, subscription.userId))
      .limit(1);

    if (!user || !user.gonkaAddress) {
      return { success: false, error: "User or wallet not found" };
    }

    // Send tokens
    let txHash: string | undefined;
    if (TREASURY_ENCRYPTED_MNEMONIC && TREASURY_ADDRESS) {
      console.log(`[topup] Sending ${NGONKA_PER_SUBSCRIPTION} ngonka to ${user.gonkaAddress}`);
      
      const [transfer] = await db
        .insert(tokenTransfers)
        .values({
          userId: user.id,
          subscriptionId: subscription.id,
          fromAddress: TREASURY_ADDRESS,
          toAddress: user.gonkaAddress,
          amountNgonka: NGONKA_PER_SUBSCRIPTION,
          status: "pending",
        })
        .returning();

      try {
        txHash = await sendTokens(TREASURY_ENCRYPTED_MNEMONIC, user.gonkaAddress, NGONKA_PER_SUBSCRIPTION);
        
        await db
          .update(tokenTransfers)
          .set({ status: "success", txHash })
          .where(eq(tokenTransfers.id, transfer.id));
      } catch (sendError) {
        const errorMsg = sendError instanceof Error ? sendError.message : "Unknown error";
        console.error(`[topup] Token send failed:`, sendError);
        
        await db
          .update(tokenTransfers)
          .set({ status: "failed", errorMessage: errorMsg })
          .where(eq(tokenTransfers.id, transfer.id));
      }
    }

    // Update subscription
    await db
      .update(apiSubscriptions)
      .set({
        tokensAllocated: subscription.tokensAllocated + TOKENS_PER_SUBSCRIPTION,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        updatedAt: new Date(),
      })
      .where(eq(apiSubscriptions.id, subscription.id));

    return {
      success: true,
      gonkaAddress: user.gonkaAddress,
      txHash,
    };
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
