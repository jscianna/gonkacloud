import { and, eq, isNull, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import { calculateCostUsd, estimateCostUsd, PRICING } from "@/lib/api/pricing";
import { rateLimit } from "@/lib/api/rate-limit";
import { ApiAuthError, validateKey } from "@/lib/api/validate-key";
import { db } from "@/lib/db";
import { apiKeys, transactions, usageLogs, users } from "@/lib/db/schema";

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

function jsonError(error: ApiError | ApiAuthError) {
  const status = (error as any).status ?? 500;
  const type = (error as any).type ?? "server_error";
  const code = (error as any).code ?? "internal_error";

  return NextResponse.json({ error: { message: error.message, type, code } }, { status });
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
    const { user, apiKey } = await validateKey(req);

    const rl = await rateLimit(apiKey.id);
    if (!rl.success) {
      const res = jsonError(new ApiError(429, "Rate limit exceeded", "rate_limit_error", "rate_limited"));
      res.headers.set("X-RateLimit-Limit", String(rl.limit));
      res.headers.set("X-RateLimit-Remaining", String(rl.remaining));
      res.headers.set("X-RateLimit-Reset", String(rl.reset));
      return res;
    }

    const body = (await req.json().catch(() => null)) as any;
    if (!body || typeof body !== "object") {
      throw new ApiError(400, "Invalid JSON body", "invalid_request_error", "invalid_json");
    }

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

    const reserveUsd = estimateCostUsd(model, messages, typeof maxTokens === "number" ? maxTokens : undefined);

    const currentBalance = Number.parseFloat(user.balanceUsd ?? "0");
    if (!Number.isFinite(currentBalance) || currentBalance < reserveUsd) {
      throw new ApiError(402, "Insufficient balance", "billing_error", "insufficient_balance");
    }

    // Reserve funds up-front to prevent races/overdraft.
    const reserved = await reserveFunds(user.id, reserveUsd);
    if (!reserved) {
      throw new ApiError(402, "Insufficient balance", "billing_error", "insufficient_balance");
    }

    // Update last used.
    await db
      .update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(and(eq(apiKeys.id, apiKey.id), isNull(apiKeys.revokedAt)));

    const baseUrl = process.env.GONKA_API_URL ?? process.env.GONKA_API_BASE_URL;
    const gonkaKey = process.env.GONKA_API_KEY;

    if (!baseUrl || !gonkaKey) {
      throw new ApiError(500, "Gonka API not configured", "server_error", "missing_upstream_config");
    }

    const upstreamUrl = new URL("/v1/chat/completions", baseUrl).toString();

    const upstreamBody = {
      model,
      messages,
      stream,
      temperature,
      max_tokens: maxTokens,
      // Ask upstream to include usage at end of stream if supported.
      ...(stream ? { stream_options: { include_usage: true } } : null),
    };

    const upstreamRes = await fetch(upstreamUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${gonkaKey}`,
      },
      body: JSON.stringify(upstreamBody),
    });

    if (!upstreamRes.ok || !upstreamRes.body) {
      const text = await upstreamRes.text().catch(() => "");
      // Refund reserved funds since we didn't complete inference.
      await adjustBalance(user.id, reserveUsd);

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
      const refundUsd = Math.max(0, reserveUsd - actualCostUsd);

      if (refundUsd > 0) {
        await adjustBalance(user.id, refundUsd);
      }

      // Record usage log + transaction.
      const [balanceRow] = await db.select({ balanceUsd: users.balanceUsd }).from(users).where(eq(users.id, user.id)).limit(1);

      await db.insert(usageLogs).values({
        userId: user.id,
        apiKeyId: apiKey.id,
        model,
        promptTokens: Number.isFinite(promptTokens) ? promptTokens : 0,
        completionTokens: Number.isFinite(completionTokens) ? completionTokens : 0,
        costUsd: toUsdString(actualCostUsd),
      });

      await db.insert(transactions).values({
        userId: user.id,
        type: "usage",
        amountUsd: toUsdString(actualCostUsd),
        balanceAfterUsd: balanceRow?.balanceUsd,
      });

      const res = NextResponse.json(json, { status: 200 });
      res.headers.set("X-Request-Cost", actualCostUsd.toFixed(6));
      res.headers.set("X-RateLimit-Remaining", String(rl.remaining));
      res.headers.set("X-RateLimit-Reset", String(rl.reset));
      return res;
    }

    // Streaming: pipe SSE through, capture final usage if present.
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    let buffer = "";
    let finalUsage: { prompt_tokens?: number; completion_tokens?: number } | null = null;

    const readable = new ReadableStream<Uint8Array>({
      async start(controller) {
        const reader = upstreamRes.body!.getReader();

        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            if (value) {
              controller.enqueue(value);
              buffer += decoder.decode(value, { stream: true });

              // Parse SSE events best-effort.
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
          }
        } finally {
          controller.close();

          const promptTokens = Number(finalUsage?.prompt_tokens ?? 0);
          const completionTokens = Number(finalUsage?.completion_tokens ?? 0);

          const actualCostUsd = calculateCostUsd(model, promptTokens, completionTokens);
          const refundUsd = Math.max(0, reserveUsd - actualCostUsd);

          if (refundUsd > 0) {
            await adjustBalance(user.id, refundUsd);
          }

          const [balanceRow] = await db.select({ balanceUsd: users.balanceUsd }).from(users).where(eq(users.id, user.id)).limit(1);

          await db.insert(usageLogs).values({
            userId: user.id,
            apiKeyId: apiKey.id,
            model,
            promptTokens: Number.isFinite(promptTokens) ? promptTokens : 0,
            completionTokens: Number.isFinite(completionTokens) ? completionTokens : 0,
            costUsd: toUsdString(actualCostUsd),
          });

          await db.insert(transactions).values({
            userId: user.id,
            type: "usage",
            amountUsd: toUsdString(actualCostUsd),
            balanceAfterUsd: balanceRow?.balanceUsd,
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
        // For streaming we only know reserved upfront.
        "X-Request-Cost": reserveUsd.toFixed(6),
        "X-Request-Cost-Estimated": "true",
        "X-RateLimit-Remaining": String(rl.remaining),
        "X-RateLimit-Reset": String(rl.reset),
      },
    });

    return res;
  } catch (error) {
    if (error instanceof ApiAuthError) return jsonError(error);
    if (error instanceof ApiError) return jsonError(error);

    return NextResponse.json(
      { error: { message: "Internal server error", type: "server_error", code: "internal_error" } },
      { status: 500 }
    );
  }
}
