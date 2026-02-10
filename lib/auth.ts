import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export class UnauthorizedError extends Error {
  status = 401;

  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export async function getCurrentUser() {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return null;
  }

  const [dbUser] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
  const clerkUser = await currentUser();

  return {
    clerkUser,
    dbUser: dbUser ?? null,
  };
}

export async function requireAuth() {
  const { userId } = await auth();

  if (!userId) {
    throw new UnauthorizedError();
  }

  return userId;
}

export async function getUserBalance(userId: string) {
  const [user] = await db.select({ balanceUsd: users.balanceUsd }).from(users).where(eq(users.id, userId)).limit(1);

  return user?.balanceUsd ?? "0";
}
