import { auth } from "@clerk/nextjs/server";
import { and, eq, gte, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import { calculateCostUsd, estimateCostUsd, PRICING } from "@/lib/api/pricing";
import { rateLimit } from "@/lib/api/rate-limit";
import { db } from "@/lib/db";
import { transactions, usageLogs, users } from "@/lib/db/schema";
import { gonkaInference } from "@/lib/gonka/inference";
import { getBalance } from "@/lib/wallet/gonka";

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
      })
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1);

    if (!dbUser) {
      throw new ApiError(400, "User not provisioned", "invalid_request_error", "user_not_provisioned");
    }

    if (!dbUser.gonkaAddress || !dbUser.encryptedMnemonic) {
      throw new ApiError(400, "Wallet not provisioned", "invalid_request_error", "wallet_not_provisioned");
    }
    console.log("User:", dbUser?.id, "Gonka Address:", dbUser?.gonkaAddress);

    const gonkaBalance = await getBalance(dbUser.gonkaAddress);
    if (Number(gonkaBalance.ngonka) <= 0) {
      return NextResponse.json(
        { error: "Insufficient Gonka balance. Please deposit GONKA tokens or add USD credits." },
        { status: 402 }
      );
    }

    const reserveUsd = estimateCostUsd(model, messages, typeof maxTokens === "number" ? maxTokens : undefined);
    const useUsdBilling = false; // Future: enable for USD -> GONKA auto-conversion.
    let reservedUsd = false;

    if (useUsdBilling) {
      const currentBalance = Number.parseFloat(dbUser.balanceUsd ?? "0");
      if (!Number.isFinite(currentBalance) || currentBalance < reserveUsd) {
        throw new ApiError(402, "Insufficient balance", "billing_error", "insufficient_balance");
      }

      const reserved = await reserveFunds(dbUser.id, reserveUsd);
      if (!reserved) {
        throw new ApiError(402, "Insufficient balance", "billing_error", "insufficient_balance");
      }
      reservedUsd = true;
    }

    console.log("Calling Gonka inference...");
    const upstreamRes = await gonkaInference({
      encryptedMnemonic: dbUser.encryptedMnemonic,
      gonkaAddress: dbUser.gonkaAddress,
      model,
      messages,
      stream,
      temperature,
      max_tokens: maxTokens,
    });
    console.log("Gonka response status:", upstreamRes.status);

    if (!upstreamRes.ok || !upstreamRes.body) {
      const text = await upstreamRes.text().catch(() => "");
      if (reservedUsd) {
        await adjustBalance(dbUser.id, reserveUsd);
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
      const actualCostUsd = calculateCostUsd(model, promptTokens, completionTokens);

      if (reservedUsd) {
        const refundUsd = Math.max(0, reserveUsd - actualCostUsd);
        if (refundUsd > 0) {
          await adjustBalance(dbUser.id, refundUsd);
        }
      }

      const [balanceRow] = await db.select({ balanceUsd: users.balanceUsd }).from(users).where(eq(users.id, dbUser.id)).limit(1);

      await db.insert(usageLogs).values({
        userId: dbUser.id,
        apiKeyId: null,
        model,
        promptTokens: Number.isFinite(promptTokens) ? promptTokens : 0,
        completionTokens: Number.isFinite(completionTokens) ? completionTokens : 0,
        costUsd: toUsdString(actualCostUsd),
      });

      if (reservedUsd) {
        await db.insert(transactions).values({
          userId: dbUser.id,
          type: "usage",
          amountUsd: toUsdString(actualCostUsd),
          balanceAfterUsd: balanceRow?.balanceUsd,
        });
      }

      const res = NextResponse.json(json, { status: 200 });
      res.headers.set("X-Request-Cost", actualCostUsd.toFixed(6));
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
          const actualCostUsd = calculateCostUsd(model, promptTokens, completionTokens);

          if (reservedUsd) {
            const refundUsd = Math.max(0, reserveUsd - actualCostUsd);
            if (refundUsd > 0) {
              await adjustBalance(dbUser.id, refundUsd);
            }
          }

          const [balanceRow] = await db.select({ balanceUsd: users.balanceUsd }).from(users).where(eq(users.id, dbUser.id)).limit(1);

          await db.insert(usageLogs).values({
            userId: dbUser.id,
            apiKeyId: null,
            model,
            promptTokens: Number.isFinite(promptTokens) ? promptTokens : 0,
            completionTokens: Number.isFinite(completionTokens) ? completionTokens : 0,
            costUsd: toUsdString(actualCostUsd),
          });

          if (reservedUsd) {
            await db.insert(transactions).values({
              userId: dbUser.id,
              type: "usage",
              amountUsd: toUsdString(actualCostUsd),
              balanceAfterUsd: balanceRow?.balanceUsd,
            });
          }
        }
      },
    });

    const res = new NextResponse(readable, {
      status: 200,
      headers: {
        "content-type": upstreamRes.headers.get("content-type") ?? "text/event-stream",
        "cache-control": "no-cache, no-transform",
        connection: "keep-alive",
        "X-Request-Cost": reserveUsd.toFixed(6),
        "X-Request-Cost-Estimated": "true",
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
