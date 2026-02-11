import crypto from "crypto";
import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/lib/db";
import { apiKeys, users } from "@/lib/db/schema";

export class ApiAuthError extends Error {
  status = 401;
  type = "authentication_error";
  code = "invalid_api_key";

  constructor(message = "Invalid API key") {
    super(message);
    this.name = "ApiAuthError";
  }
}

function sha256Hex(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export function extractBearerToken(req: Request) {
  const auth = req.headers.get("authorization") ?? req.headers.get("Authorization");
  if (!auth) return null;

  const match = auth.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;

  return match[1]?.trim() ?? null;
}

export async function validateKey(req: Request) {
  const token = extractBearerToken(req);

  if (!token || !token.startsWith("sk-gc-")) {
    throw new ApiAuthError();
  }

  const keyHash = sha256Hex(token);

  const [row] = await db
    .select({
      apiKey: {
        id: apiKeys.id,
        userId: apiKeys.userId,
        name: apiKeys.name,
        keyPrefix: apiKeys.keyPrefix,
        revokedAt: apiKeys.revokedAt,
      },
      user: {
        id: users.id,
        clerkId: users.clerkId,
        email: users.email,
        balanceUsd: users.balanceUsd,
        gonkaAddress: users.gonkaAddress,
        encryptedMnemonic: users.encryptedMnemonic,
      },
    })
    .from(apiKeys)
    .innerJoin(users, eq(users.id, apiKeys.userId))
    .where(and(eq(apiKeys.keyHash, keyHash), isNull(apiKeys.revokedAt)))
    .limit(1);

  if (!row) {
    throw new ApiAuthError();
  }

  return {
    user: row.user,
    apiKey: row.apiKey,
  };
}
