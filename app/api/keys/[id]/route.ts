import { and, eq, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";

import { UnauthorizedError, requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiKeys, users } from "@/lib/db/schema";

export async function DELETE(_req: Request, ctx: { params: { id: string } }) {
  try {
    const clerkId = await requireAuth();
    const id = ctx.params.id;

    const [dbUser] = await db.select({ id: users.id }).from(users).where(eq(users.clerkId, clerkId)).limit(1);

    if (!dbUser) {
      return NextResponse.json({ error: "User not provisioned" }, { status: 400 });
    }

    const [updated] = await db
      .update(apiKeys)
      .set({ revokedAt: new Date() })
      .where(and(eq(apiKeys.id, id), eq(apiKeys.userId, dbUser.id), isNull(apiKeys.revokedAt)))
      .returning({ id: apiKeys.id });

    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to revoke key" }, { status: 500 });
  }
}
