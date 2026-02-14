"use client";

import { EncryptionProvider } from "@/components/encryption/encryption-provider";
import { PinModal } from "@/components/encryption/pin-modal";
import { EncryptedChatClient } from "./encrypted-chat-client";

interface Props {
  userId: string;
}

export function EncryptedChatWrapper({ userId }: Props) {
  return (
    <EncryptionProvider userId={userId}>
      <PinModal />
      <EncryptedChatClient />
    </EncryptionProvider>
  );
}
