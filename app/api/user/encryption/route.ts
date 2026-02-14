import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

// GET /api/user/encryption - Get PIN verifier
export async function GET() {
  try {
    const clerkId = await requireAuth();

    const [user] = await db
      .select({ pinVerifier: users.pinVerifier })
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ pinVerifier: user.pinVerifier });
  } catch (error) {
    console.error("Get encryption error:", error);
    return NextResponse.json({ error: "Failed to get encryption status" }, { status: 500 });
  }
}

// POST /api/user/encryption - Set PIN verifier
export async function POST(req: Request) {
  try {
    const clerkId = await requireAuth();

    const body = await req.json();
    const { pinVerifier } = body;

    if (!pinVerifier || typeof pinVerifier !== "string") {
      return NextResponse.json({ error: "Invalid PIN verifier" }, { status: 400 });
    }

    await db
      .update(users)
      .set({ pinVerifier })
      .where(eq(users.clerkId, clerkId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Set encryption error:", error);
    return NextResponse.json({ error: "Failed to set up encryption" }, { status: 500 });
  }
}
