import { getCurrentUser } from "@/lib/auth";

import { ChatClient } from "@/components/chat/chat-client";

export default async function ChatPage() {
  const user = await getCurrentUser();
  const balanceUsd = user?.dbUser?.balanceUsd ?? "0";

  return (
    <ChatClient initialBalanceUsd={`$${Number.parseFloat(balanceUsd).toFixed(2)}`} />
  );
}
