import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";

// This endpoint should be called by a cron job (e.g., Vercel Cron)
// Add to vercel.json: { "crons": [{ "path": "/api/cron/cleanup-messages", "schedule": "0 3 * * *" }] }

export async function GET(req: Request) {
  // Verify cron secret (optional but recommended)
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Delete messages older than 30 days
    const messagesResult = await db.execute(
      sql`DELETE FROM messages WHERE created_at < NOW() - INTERVAL '30 days' RETURNING id`
    );
    
    const messagesDeleted = Array.isArray(messagesResult) ? messagesResult.length : 0;

    // Delete empty conversations
    const convsResult = await db.execute(
      sql`DELETE FROM conversations c WHERE NOT EXISTS (SELECT 1 FROM messages m WHERE m.conversation_id = c.id) RETURNING id`
    );
    
    const convsDeleted = Array.isArray(convsResult) ? convsResult.length : 0;

    console.log(`[cleanup] Deleted ${messagesDeleted} messages and ${convsDeleted} empty conversations`);

    return NextResponse.json({
      success: true,
      messagesDeleted,
      conversationsDeleted: convsDeleted,
    });
  } catch (error) {
    console.error("Cleanup error:", error);
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  }
}
