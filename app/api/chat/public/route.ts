/**
 * Public chat endpoint - no auth required
 * Uses the shared Gonka wallet for free inference
 * Rate limited by IP to prevent abuse
 */

import { NextResponse } from "next/server";

import { gonkaInference } from "@/lib/gonka/inference";

// Simple in-memory rate limiting by IP
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
  // Check if wallet is configured
  if (!process.env.GONKA_MNEMONIC) {
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
    const { messages, model = "Qwen/Qwen3-235B-A22B-Instruct-2507-FP8", stream = false } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: { message: "messages is required", type: "invalid_request_error", code: "missing_messages" } },
        { status: 400 }
      );
    }

    // Limit conversation length for public chat
    const limitedMessages = messages.slice(-5);

    const upstreamRes = await gonkaInference({
      model,
      messages: limitedMessages,
      max_tokens: 500, // Limit tokens for public chat
      stream,
    });

    if (!upstreamRes.ok) {
      const errorText = await upstreamRes.text();
      console.error("[public-chat] Upstream error:", upstreamRes.status, errorText);
      
      if (upstreamRes.status === 429 || errorText.includes("rate limit")) {
        return NextResponse.json(
          { error: { message: "The network is busy. Please try again in a few minutes.", type: "rate_limit_error", code: "upstream_rate_limited" } },
          { status: 429 }
        );
      }
      
      return NextResponse.json(
        { error: { message: "Inference failed", type: "server_error", code: "upstream_error" } },
        { status: 502 }
      );
    }

    if (stream) {
      return new Response(upstreamRes.body, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
          "X-RateLimit-Remaining": String(remaining),
        },
      });
    }

    const data = await upstreamRes.json();
    return NextResponse.json(data, {
      headers: { "X-RateLimit-Remaining": String(remaining) }
    });

  } catch (error) {
    console.error("[public-chat] Error:", error);
    
    const message = error instanceof Error ? error.message : "Inference failed";
    
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
