import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { PublicChatClient } from "@/components/chat/public-chat-client";

export default async function HomePage() {
  const { userId } = await auth();

  // Authenticated users go to dashboard
  if (userId) {
    redirect("/chat");
  }

  // Public users get the chat-first landing page
  return <PublicChatClient />;
}
