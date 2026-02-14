import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { conversations, users } from "@/lib/db/schema";

// GET /api/conversations - List user's conversations
export async function GET() {
  try {
    const clerkId = await requireAuth();

    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const convos = await db
      .select({
        id: conversations.id,
        title: conversations.title,
        createdAt: conversations.createdAt,
        updatedAt: conversations.updatedAt,
      })
      .from(conversations)
      .where(eq(conversations.userId, user.id))
      .orderBy(desc(conversations.updatedAt))
      .limit(50);

    return NextResponse.json({ conversations: convos });
  } catch (error) {
    console.error("List conversations error:", error);
    return NextResponse.json({ error: "Failed to list conversations" }, { status: 500 });
  }
}

// POST /api/conversations - Create new conversation
export async function POST(req: Request) {
  try {
    const clerkId = await requireAuth();

    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const title = body.title || "New chat";

    const [convo] = await db
      .insert(conversations)
      .values({
        userId: user.id,
        title,
      })
      .returning();

    return NextResponse.json({ conversation: convo });
  } catch (error) {
    console.error("Create conversation error:", error);
    return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });
  }
}
