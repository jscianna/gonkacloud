/**
 * Public chat endpoint - no auth required
 * Uses the Vex wallet (funded by John) for free inference
 * Rate limited by IP to prevent abuse
 */

import { NextResponse } from "next/server";

import { gonkaInference } from "@/lib/gonka/inference";

// Dogecat wallet - stored server-side for public chat
const DOGECAT_WALLET_ADDRESS = process.env.DOGECAT_WALLET_ADDRESS || "gonka1g72am4v9gc5c0z66pcvtlz73hk6k52r0kkv6fy";
const DOGECAT_WALLET_ENCRYPTED_MNEMONIC = process.env.DOGECAT_WALLET_ENCRYPTED_MNEMONIC;

// Simple in-memory rate limiting by IP (for serverless, use Upstash Redis in production)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_REQUESTS = 10; // requests per window
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

function getRateLimitKey(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  return ip;
}

function checkRateLimit(key: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT_REQUESTS - 1 };
  }

  if (entry.count >= RATE_LIMIT_REQUESTS) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT_REQUESTS - entry.count };
}

export async function POST(req: Request) {
  // Check if dogecat wallet is configured
  if (!DOGECAT_WALLET_ENCRYPTED_MNEMONIC) {
    return NextResponse.json(
      { error: { message: "Public chat not configured", type: "server_error", code: "not_configured" } },
      { status: 503 }
    );
  }

  // Rate limit by IP
  const ipKey = getRateLimitKey(req);
  const { allowed, remaining } = checkRateLimit(ipKey);

  if (!allowed) {
    return NextResponse.json(
      { error: { message: "Rate limit exceeded. Please try again in a minute.", type: "rate_limit_error", code: "rate_limited" } },
      { status: 429, headers: { "X-RateLimit-Remaining": "0" } }
    );
  }

  try {
    const body = await req.json();
    const { messages, model = "Qwen/Qwen3-235B-A22B-Instruct-2507-FP8" } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: { message: "messages is required", type: "invalid_request_error", code: "missing_messages" } },
        { status: 400 }
      );
    }

    // Limit conversation length for public chat
    const limitedMessages = messages.slice(-5); // Last 5 messages only

    // Run inference using Dogecat wallet
    const result = await gonkaInference({
      model,
      messages: limitedMessages,
      maxTokens: 500, // Limit tokens for public chat
      gonkaAddress: DOGECAT_WALLET_ADDRESS,
      encryptedMnemonic: DOGECAT_WALLET_ENCRYPTED_MNEMONIC,
    });

    // Return OpenAI-compatible response
    return NextResponse.json({
      id: `chatcmpl-public-${Date.now()}`,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model,
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: result.content,
          },
          finish_reason: "stop",
        },
      ],
      usage: result.usage,
    }, {
      headers: { "X-RateLimit-Remaining": String(remaining) }
    });

  } catch (error) {
    console.error("[public-chat] Error:", error);
    
    const message = error instanceof Error ? error.message : "Inference failed";
    
    // Check for rate limit from upstream
    if (message.includes("rate limit")) {
      return NextResponse.json(
        { error: { message: "The network is busy. Please try again in a few minutes.", type: "rate_limit_error", code: "upstream_rate_limited" } },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: { message, type: "server_error", code: "inference_failed" } },
      { status: 500 }
    );
  }
}
