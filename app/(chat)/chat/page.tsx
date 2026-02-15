import { eq, and, sql } from "drizzle-orm";
import { redirect } from "next/navigation";

import { ChatLayout } from "@/components/chat/chat-layout";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiSubscriptions } from "@/lib/db/schema";

export default async function ChatPage() {
  const user = await getCurrentUser();

  if (!user?.clerkUser) {
    redirect("/sign-in");
  }

  // Get subscription info for header display
  let tokensRemaining = 0;
  let hasSubscription = false;

  if (user.dbUser?.id) {
    try {
      const subscription = await db.query.apiSubscriptions.findFirst({
        where: and(
          eq(apiSubscriptions.userId, user.dbUser.id),
          sql`${apiSubscriptions.status} IN ('active', 'free')`
        ),
      });

      if (subscription) {
        hasSubscription = true;
        const allocated = Number(subscription.tokensAllocated ?? 0);
        const used = Number(subscription.tokensUsed ?? 0);
        tokensRemaining = Math.max(0, allocated - used);
      }
    } catch (e) {
      console.warn("Could not fetch subscription:", e instanceof Error ? e.message : e);
    }
  }

  return (
    <ChatLayout
      tokensRemaining={tokensRemaining}
      hasSubscription={hasSubscription}
    />
  );
}
