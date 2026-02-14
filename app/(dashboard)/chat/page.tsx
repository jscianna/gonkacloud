import { getCurrentUser } from "@/lib/auth";

import { ChatClient } from "@/components/chat/chat-client";

export default async function ChatPage() {
  const user = await getCurrentUser();
  const isLoggedIn = !!user?.clerkUser;

  return (
    <ChatClient 
      isPublic={!isLoggedIn}
    />
  );
}
