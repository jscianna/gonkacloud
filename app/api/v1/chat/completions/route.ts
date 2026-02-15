/**
 * OpenAI-compatible API endpoint for dogecat
 * 
 * Users authenticate with API key, we handle Gonka signing/forwarding
 */

import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { eq, isNull, and, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { apiKeys, usageLogs, apiSubscriptions } from "@/lib/db/schema";
import { gonkaInference } from "@/lib/gonka/inference";

function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

function extractApiKey(req: Request): string | null {
  const auth = req.headers.get("authorization");
  if (!auth) return null;
  
  if (auth.startsWith("Bearer ")) {
    return auth.slice(7);
  }
  return auth;
}

export async function POST(req: Request) {
  try {
    // 1. Extract and validate API key
    const apiKey = extractApiKey(req);
    if (!apiKey) {
      return NextResponse.json(
        { error: { message: "Missing API key", type: "invalid_request_error", code: "missing_api_key" } },
        { status: 401 }
      );
    }

    const keyHash = hashApiKey(apiKey);
    
    // 2. Look up API key and user
    const keyRecord = await db.query.apiKeys.findFirst({
      where: and(
        eq(apiKeys.keyHash, keyHash),
        isNull(apiKeys.revokedAt)
      ),
      with: { user: true },
    });

    if (!keyRecord) {
      return NextResponse.json(
        { error: { message: "Invalid API key", type: "invalid_request_error", code: "invalid_api_key" } },
        { status: 401 }
      );
    }

    const user = keyRecord.user;

    // 3. Check subscription (free tier or active paid)
    const subscription = await db.query.apiSubscriptions.findFirst({
      where: and(
        eq(apiSubscriptions.userId, user.id),
        sql`${apiSubscriptions.status} IN ('active', 'free')`
      ),
    });

    if (!subscription) {
      return NextResponse.json(
        { error: { message: "No active subscription. Sign up to get 1M free tokens!", type: "billing_error", code: "no_subscription" } },
        { status: 402 }
      );
    }

    const tokensRemaining = (subscription.tokensAllocated ?? 0n) - (subscription.tokensUsed ?? 0n);
    if (tokensRemaining <= 0n) {
      const message = subscription.status === "free" 
        ? "Free tier limit reached. Subscribe for 100M tokens/month at $4.99!"
        : "Token limit reached. Wait for renewal or upgrade.";
      return NextResponse.json(
        { error: { message, type: "billing_error", code: "insufficient_tokens" } },
        { status: 402 }
      );
    }

    // 4. Parse request body
    const body = await req.json();
    const { 
      model = "Qwen/Qwen3-235B-A22B-Instruct-2507-FP8", 
      messages, 
      stream = false,
      max_tokens,
      temperature 
    } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: { message: "messages is required", type: "invalid_request_error", code: "missing_messages" } },
        { status: 400 }
      );
    }

    // 5. Update last used timestamp
    await db.update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, keyRecord.id));

    // 6. Run inference using shared wallet
    const upstreamRes = await gonkaInference({
      model,
      messages,
      stream,
      max_tokens,
      temperature,
    });

    if (!upstreamRes.ok) {
      const errorText = await upstreamRes.text();
      console.error("[api/v1] Upstream error:", upstreamRes.status, errorText);
      
      if (upstreamRes.status === 429) {
        return NextResponse.json(
          { error: { message: "Rate limited. Please try again.", type: "rate_limit_error", code: "upstream_rate_limited" } },
          { status: 429 }
        );
      }
      
      return NextResponse.json(
        { error: { message: "Inference failed", type: "server_error", code: "upstream_error" } },
        { status: 502 }
      );
    }

    // 7. For streaming, proxy the response
    if (stream) {
      return new Response(upstreamRes.body, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    }

    // 8. For non-streaming, parse and log usage
    const data = await upstreamRes.json();
    
    const usage = data?.usage;
    if (usage) {
      const promptTokens = Number(usage.prompt_tokens ?? 0);
      const completionTokens = Number(usage.completion_tokens ?? 0);
      const totalTokens = promptTokens + completionTokens;
      
      const costUsd = (promptTokens * 0.5 + completionTokens * 1.0) / 1_000_000;
      
      // Deduct from subscription
      if (totalTokens > 0) {
        await db.update(apiSubscriptions)
          .set({ 
            tokensUsed: sql`${apiSubscriptions.tokensUsed} + ${totalTokens}`,
            updatedAt: new Date()
          })
          .where(eq(apiSubscriptions.id, subscription.id));
      }

      await db.insert(usageLogs).values({
        userId: user.id,
        apiKeyId: keyRecord.id,
        model,
        promptTokens,
        completionTokens,
        costUsd: costUsd.toFixed(6),
      });
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error("[api/v1] Error:", error);
    return NextResponse.json(
      { error: { message: "Internal server error", type: "server_error", code: "internal_error" } },
      { status: 500 }
    );
  }
}
