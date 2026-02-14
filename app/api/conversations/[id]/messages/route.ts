import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { conversations, messages, users } from "@/lib/db/schema";

type RouteParams = { params: Promise<{ id: string }> };

// POST /api/conversations/[id]/messages - Add message to conversation
export async function POST(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const clerkId = await requireAuth();

    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify conversation belongs to user
    const [convo] = await db
      .select({ id: conversations.id, title: conversations.title })
      .from(conversations)
      .where(and(eq(conversations.id, id), eq(conversations.userId, user.id)))
      .limit(1);

    if (!convo) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const body = await req.json();
    const { role, content } = body;

    if (!role || !content) {
      return NextResponse.json({ error: "Role and content are required" }, { status: 400 });
    }

    if (!["user", "assistant", "system"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Insert message
    const [message] = await db
      .insert(messages)
      .values({
        conversationId: id,
        role,
        content,
      })
      .returning();

    // Auto-title: if this is the first user message and title is default, update it
    if (role === "user" && convo.title === "New chat") {
      const title = content.slice(0, 50) + (content.length > 50 ? "..." : "");
      await db
        .update(conversations)
        .set({ title, updatedAt: new Date() })
        .where(eq(conversations.id, id));
    } else {
      // Just update the timestamp
      await db
        .update(conversations)
        .set({ updatedAt: new Date() })
        .where(eq(conversations.id, id));
    }

    return NextResponse.json({ message });
  } catch (error) {
    console.error("Add message error:", error);
    return NextResponse.json({ error: "Failed to add message" }, { status: 500 });
  }
}
