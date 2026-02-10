import { getCurrentUser } from "@/lib/auth";

import { ChatClient } from "@/components/chat/chat-client";

export default async function ChatPage() {
  const user = await getCurrentUser();
  const balanceUsd = user?.dbUser?.balanceUsd ?? "0";

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Chat</h1>
        <p className="mt-1 text-sm text-slate-600">Streaming chat via the OpenAI-compatible API.</p>
      </div>

      <ChatClient initialBalanceUsd={`$${Number.parseFloat(balanceUsd).toFixed(2)}`} />
    </section>
  );
}
