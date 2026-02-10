import { eq, desc } from "drizzle-orm";

import { ApiKeysClient, type ApiKeyRow } from "@/components/dashboard/api-keys-client";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiKeys } from "@/lib/db/schema";

export default async function ApiKeysPage() {
  const user = await getCurrentUser();

  let initialKeys: ApiKeyRow[] = [];

  if (user?.dbUser?.id) {
    const rows = await db
      .select({
        id: apiKeys.id,
        name: apiKeys.name,
        keyPrefix: apiKeys.keyPrefix,
        createdAt: apiKeys.createdAt,
        lastUsedAt: apiKeys.lastUsedAt,
        revokedAt: apiKeys.revokedAt,
      })
      .from(apiKeys)
      .where(eq(apiKeys.userId, user.dbUser.id))
      .orderBy(desc(apiKeys.createdAt));

    initialKeys = rows.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
      lastUsedAt: row.lastUsedAt ? row.lastUsedAt.toISOString() : null,
      revokedAt: row.revokedAt ? row.revokedAt.toISOString() : null,
    }));
  }

  return <ApiKeysClient initialKeys={initialKeys} />;
}
