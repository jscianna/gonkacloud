/**
 * OpenAI-compatible API endpoint for dogecat
 * 
 * Users authenticate with API key, we handle Gonka signing/forwarding
 */

import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { eq, isNull, and } from "drizzle-orm";

import { db } from "@/lib/db";
import { apiKeys, users, usageLogs } from "@/lib/db/schema";
import { gonkaInference } from "@/lib/gonka/inference";

function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

function extractApiKey(req: Request): string | null {
  const auth = req.headers.get("authorization");
  if (!auth) return null;
  
  // Support both "Bearer xxx" and just "xxx"
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
    
    // 3. Check user has wallet credentials
    if (!user.gonkaAddress || !user.encryptedMnemonic) {
      return NextResponse.json(
        { error: { message: "Account not fully provisioned. Please contact support.", type: "server_error", code: "no_wallet" } },
        { status: 500 }
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

    // 6. Run inference using user's wallet
    const upstreamRes = await gonkaInference({
      model,
      messages,
      stream,
      max_tokens,
      temperature,
      gonkaAddress: user.gonkaAddress,
      encryptedMnemonic: user.encryptedMnemonic,
    });

    // 7. Handle errors from upstream
    if (!upstreamRes.ok) {
      const errorText = await upstreamRes.text();
      console.error("[api/v1] Upstream error:", upstreamRes.status, errorText);
      
      if (upstreamRes.status === 429) {
        return NextResponse.json(
          { error: { message: "Rate limited by inference provider. Please try again.", type: "rate_limit_error", code: "upstream_rate_limited" } },
          { status: 429 }
        );
      }
      
      return NextResponse.json(
        { error: { message: "Inference failed", type: "server_error", code: "upstream_error" } },
        { status: 502 }
      );
    }

    // 8. For streaming, proxy the response directly
    if (stream) {
      return new Response(upstreamRes.body, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    }

    // 9. For non-streaming, parse and log usage
    const data = await upstreamRes.json();
    
    // Log usage if we have token counts
    const usage = data?.usage;
    if (usage) {
      const promptTokens = Number(usage.prompt_tokens ?? 0);
      const completionTokens = Number(usage.completion_tokens ?? 0);
      
      // Calculate cost (Qwen pricing: $0.50/1M input, $1.00/1M output)
      const costUsd = (promptTokens * 0.5 + completionTokens * 1.0) / 1_000_000;
      
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
