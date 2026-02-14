import { auth } from "@clerk/nextjs/server";
import { and, eq, gte, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import { calculateCostUsd, estimateCostUsd, PRICING } from "@/lib/api/pricing";
import { rateLimit } from "@/lib/api/rate-limit";
import { db } from "@/lib/db";
import { transactions, usageLogs, users, apiSubscriptions } from "@/lib/db/schema";
import { gonkaInference } from "@/lib/gonka/inference";

// Dogecat wallet - shared backend for all users
const DOGECAT_WALLET_ADDRESS = process.env.DOGECAT_WALLET_ADDRESS || "gonka1g72am4v9gc5c0z66pcvtlz73hk6k52r0kkv6fy";
const DOGECAT_WALLET_ENCRYPTED_MNEMONIC = process.env.DOGECAT_WALLET_ENCRYPTED_MNEMONIC;

class ApiError extends Error {
  status: number;
  type: string;
  code: string;

  constructor(status: number, message: string, type: string, code: string) {
    super(message);
    this.status = status;
    this.type = type;
    this.code = code;
  }
}

function jsonError(error: ApiError) {
  return NextResponse.json({ error: { message: error.message, type: error.type, code: error.code } }, { status: error.status });
}

function toUsdString(amount: number) {
  return amount.toFixed(6);
}

async function reserveFunds(userId: string, reserveUsd: number) {
  const reserve = toUsdString(reserveUsd);

  const [updated] = await db
    .update(users)
    .set({ balanceUsd: sql`${users.balanceUsd} - ${reserve}::numeric` })
    .where(and(eq(users.id, userId), sql`${users.balanceUsd} >= ${reserve}::numeric`))
    .returning({ balanceUsd: users.balanceUsd });

  return updated ?? null;
}

async function adjustBalance(userId: string, deltaUsd: number) {
  const delta = toUsdString(Math.abs(deltaUsd));

  const [updated] = await db
    .update(users)
    .set({
      balanceUsd:
        deltaUsd >= 0
          ? sql`${users.balanceUsd} + ${delta}::numeric`
          : sql`${users.balanceUsd} - ${delta}::numeric`,
    })
    .where(eq(users.id, userId))
    .returning({ balanceUsd: users.balanceUsd });

  return updated ?? null;
}

export async function POST(req: Request) {
  try {
    console.log("=== CHAT REQUEST STARTED ===");
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json(
        { error: { message: "Unauthorized", type: "authentication_error", code: "unauthorized" } },
        { status: 401 }
      );
    }

    const rl = await rateLimit(`chat:${clerkId}`);
    if (!rl.success) {
      const res = jsonError(new ApiError(429, "Rate limit exceeded", "rate_limit_error", "rate_limited"));
      res.headers.set("X-RateLimit-Limit", String(rl.limit));
      res.headers.set("X-RateLimit-Remaining", String(rl.remaining));
      res.headers.set("X-RateLimit-Reset", String(rl.reset));
      return res;
    }

    const loggedBody = (await req.clone().json().catch(() => null)) as any;
    console.log("Request body:", loggedBody);
    const body = loggedBody;
    if (!body || typeof body !== "object") {
      throw new ApiError(400, "Invalid JSON body", "invalid_request_error", "invalid_json");
    }

    // Never trust any client-provided user identifiers.
    const model = String(body.model ?? "");
    const messages = Array.isArray(body.messages) ? body.messages : null;
    const stream = Boolean(body.stream);
    const temperature = body.temperature;
    const maxTokens = body.max_tokens;

    if (!model || !PRICING[model]) {
      throw new ApiError(400, "Unknown or missing model", "invalid_request_error", "model_not_found");
    }

    if (!messages) {
      throw new ApiError(400, "Missing messages", "invalid_request_error", "missing_messages");
    }

    const [dbUser] = await db
      .select({
        id: users.id,
        balanceUsd: users.balanceUsd,
        gonkaAddress: users.gonkaAddress,
        encryptedMnemonic: users.encryptedMnemonic,
        inferenceRegistered: users.inferenceRegistered,
      })
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1);

    if (!dbUser) {
      throw new ApiError(400, "User not provisioned", "invalid_request_error", "user_not_provisioned");
    }

    // Check Dogecat wallet is configured
    if (!DOGECAT_WALLET_ENCRYPTED_MNEMONIC) {
      throw new ApiError(500, "Service not configured", "server_error", "no_backend_wallet");
    }

    // Check user's subscription and token balance
    let subscription = null;
    try {
      subscription = await db.query.apiSubscriptions.findFirst({
        where: and(
          eq(apiSubscriptions.userId, dbUser.id),
          eq(apiSubscriptions.status, "active")
        ),
      });
    } catch (e) {
      // Table may not exist yet
      console.warn("Could not fetch subscription:", e instanceof Error ? e.message : e);
    }

    if (!subscription) {
      throw new ApiError(402, "No active subscription. Subscribe to get API access.", "billing_error", "no_subscription");
    }

    const tokensAllocated = subscription.tokensAllocated ?? 0n;
    const tokensUsed = subscription.tokensUsed ?? 0n;
    const tokensRemaining = tokensAllocated - tokensUsed;

    if (tokensRemaining <= 0n) {
      throw new ApiError(
        402,
        "You've run out of tokens. Please wait for your next billing cycle or upgrade your subscription.",
        "billing_error",
        "insufficient_tokens"
      );
    }

    console.log("User:", dbUser?.id, "Subscription:", subscription.id, "Tokens remaining:", tokensRemaining.toString());

    // Sanitize messages: remove empty assistant messages and consecutive duplicates
    const sanitizedMessages = messages.filter((msg: any, index: number, arr: any[]) => {
      // Remove messages with empty content
      if (!msg.content || (typeof msg.content === 'string' && msg.content.trim() === '')) {
        return false;
      }
      // Remove consecutive duplicate user messages
      if (index > 0 && msg.role === 'user' && arr[index - 1]?.role === 'user') {
        const prevContent = typeof arr[index - 1].content === 'string' ? arr[index - 1].content.trim() : '';
        const currContent = typeof msg.content === 'string' ? msg.content.trim() : '';
        if (prevContent === currContent) {
          return false;
        }
      }
      return true;
    });

    if (sanitizedMessages.length === 0) {
      throw new ApiError(400, "No valid messages provided", "invalid_request_error", "empty_messages");
    }

    console.log("Calling Gonka inference via Dogecat wallet...");
    console.log("Sanitized messages count:", sanitizedMessages.length);
    const upstreamRes = await gonkaInference({
      encryptedMnemonic: DOGECAT_WALLET_ENCRYPTED_MNEMONIC,
      gonkaAddress: DOGECAT_WALLET_ADDRESS,
      model,
      messages: sanitizedMessages,
      stream,
      temperature,
      max_tokens: maxTokens,
    });
    console.log("Gonka response status:", upstreamRes.status);

    if (!upstreamRes.ok || !upstreamRes.body) {
      const text = await upstreamRes.text().catch(() => "");
      
      // Handle rate limiting specifically
      if (upstreamRes.status === 429) {
        return NextResponse.json(
          { error: { message: "The network is busy. Please try again in a few minutes.", type: "rate_limit_error", code: "upstream_rate_limited" } },
          { status: 429 }
        );
      }
      
      throw new ApiError(
        502,
        `Upstream error${text ? `: ${text.slice(0, 500)}` : ""}`,
        "server_error",
        "upstream_error"
      );
    }

    if (!stream) {
      const json = (await upstreamRes.json()) as any;
      const usage = json?.usage ?? null;

      const promptTokens = Number(usage?.prompt_tokens ?? 0);
      const completionTokens = Number(usage?.completion_tokens ?? 0);
      const totalTokens = promptTokens + completionTokens;
      const actualCostUsd = calculateCostUsd(model, promptTokens, completionTokens);

      // Deduct tokens from subscription
      if (subscription && totalTokens > 0) {
        await db.update(apiSubscriptions)
          .set({ 
            tokensUsed: sql`${apiSubscriptions.tokensUsed} + ${totalTokens}`,
            updatedAt: new Date()
          })
          .where(eq(apiSubscriptions.id, subscription.id));
      }

      // Log usage
      await db.insert(usageLogs).values({
        userId: dbUser.id,
        apiKeyId: null,
        model,
        promptTokens: Number.isFinite(promptTokens) ? promptTokens : 0,
        completionTokens: Number.isFinite(completionTokens) ? completionTokens : 0,
        costUsd: toUsdString(actualCostUsd),
      });

      const newTokensRemaining = tokensRemaining - BigInt(totalTokens);
      const res = NextResponse.json(json, { status: 200 });
      res.headers.set("X-Tokens-Used", String(totalTokens));
      res.headers.set("X-Tokens-Remaining", String(newTokensRemaining > 0n ? newTokensRemaining : 0n));
      res.headers.set("X-RateLimit-Remaining", String(rl.remaining));
      res.headers.set("X-RateLimit-Reset", String(rl.reset));
      return res;
    }

    // Streaming: proxy SSE, capture final usage if present.
    const decoder = new TextDecoder();
    let buffer = "";
    let finalUsage: { prompt_tokens?: number; completion_tokens?: number } | null = null;

    const readable = new ReadableStream<Uint8Array>({
      async start(controller) {
        const reader = upstreamRes.body!.getReader();

        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            if (!value) continue;

            controller.enqueue(value);
            buffer += decoder.decode(value, { stream: true });

            let idx;
            while ((idx = buffer.indexOf("\n\n")) !== -1) {
              const chunk = buffer.slice(0, idx);
              buffer = buffer.slice(idx + 2);

              const lines = chunk.split("\n");
              for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed.startsWith("data:")) continue;

                const data = trimmed.slice(5).trim();
                if (data === "[DONE]") continue;

                try {
                  const parsed = JSON.parse(data);
                  if (parsed?.usage) {
                    finalUsage = parsed.usage;
                  }
                } catch {
                  // ignore
                }
              }
            }
          }
        } finally {
          controller.close();

          const promptTokens = Number(finalUsage?.prompt_tokens ?? 0);
          const completionTokens = Number(finalUsage?.completion_tokens ?? 0);
          const totalTokens = promptTokens + completionTokens;
          const actualCostUsd = calculateCostUsd(model, promptTokens, completionTokens);

          // Deduct tokens from subscription
          if (subscription && totalTokens > 0) {
            await db.update(apiSubscriptions)
              .set({ 
                tokensUsed: sql`${apiSubscriptions.tokensUsed} + ${totalTokens}`,
                updatedAt: new Date()
              })
              .where(eq(apiSubscriptions.id, subscription.id));
          }

          // Log usage
          await db.insert(usageLogs).values({
            userId: dbUser.id,
            apiKeyId: null,
            model,
            promptTokens: Number.isFinite(promptTokens) ? promptTokens : 0,
            completionTokens: Number.isFinite(completionTokens) ? completionTokens : 0,
            costUsd: toUsdString(actualCostUsd),
          });
        }
      },
    });

    const res = new NextResponse(readable, {
      status: 200,
      headers: {
        "content-type": upstreamRes.headers.get("content-type") ?? "text/event-stream",
        "cache-control": "no-cache, no-transform",
        connection: "keep-alive",
        "X-Tokens-Remaining": String(tokensRemaining),
        "X-RateLimit-Remaining": String(rl.remaining),
        "X-RateLimit-Reset": String(rl.reset),
      },
    });

    return res;
  } catch (error: any) {
    console.error("=== CHAT ERROR ===");
    console.error("Error name:", error?.name);
    console.error("Error message:", error?.message);
    console.error("Error stack:", error?.stack);
    return NextResponse.json({ error: error?.message ?? "Internal server error" }, { status: 500 });
  }
}
