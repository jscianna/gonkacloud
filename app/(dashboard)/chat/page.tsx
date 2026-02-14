import { getCurrentUser } from "@/lib/auth";

import { ChatClient } from "@/components/chat/chat-client";

export default async function ChatPage() {
  const user = await getCurrentUser();
  const isLoggedIn = !!user?.clerkUser;

  // Ephemeral chat for everyone - nothing stored server-side
  return <ChatClient isPublic={!isLoggedIn} />;
}
