import { getCurrentUser } from "@/lib/auth";

import { ChatClient } from "@/components/chat/chat-client";
import { EncryptedChatWrapper } from "@/components/chat/encrypted-chat-wrapper";

export default async function ChatPage() {
  const user = await getCurrentUser();
  const isLoggedIn = !!user?.clerkUser;

  // Logged-in users get E2E encrypted chat
  if (isLoggedIn && user?.dbUser?.id) {
    return <EncryptedChatWrapper userId={user.dbUser.id} />;
  }

  // Public/anonymous users get regular chat (no encryption)
  return <ChatClient isPublic />;
}
