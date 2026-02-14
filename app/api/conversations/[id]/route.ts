import { and, asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { conversations, messages, users } from "@/lib/db/schema";

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/conversations/[id] - Get conversation with messages
export async function GET(req: Request, { params }: RouteParams) {
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

    const [convo] = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.id, id), eq(conversations.userId, user.id)))
      .limit(1);

    if (!convo) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const msgs = await db
      .select({
        id: messages.id,
        role: messages.role,
        content: messages.content,
        createdAt: messages.createdAt,
      })
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(asc(messages.createdAt));

    return NextResponse.json({ conversation: convo, messages: msgs });
  } catch (error) {
    console.error("Get conversation error:", error);
    return NextResponse.json({ error: "Failed to get conversation" }, { status: 500 });
  }
}

// PATCH /api/conversations/[id] - Update conversation (rename)
export async function PATCH(req: Request, { params }: RouteParams) {
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

    const body = await req.json();
    const { title } = body;

    if (!title || typeof title !== "string") {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const [updated] = await db
      .update(conversations)
      .set({ title, updatedAt: new Date() })
      .where(and(eq(conversations.id, id), eq(conversations.userId, user.id)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    return NextResponse.json({ conversation: updated });
  } catch (error) {
    console.error("Update conversation error:", error);
    return NextResponse.json({ error: "Failed to update conversation" }, { status: 500 });
  }
}

// DELETE /api/conversations/[id] - Delete conversation
export async function DELETE(req: Request, { params }: RouteParams) {
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

    const [deleted] = await db
      .delete(conversations)
      .where(and(eq(conversations.id, id), eq(conversations.userId, user.id)))
      .returning({ id: conversations.id });

    if (!deleted) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete conversation error:", error);
    return NextResponse.json({ error: "Failed to delete conversation" }, { status: 500 });
  }
}
