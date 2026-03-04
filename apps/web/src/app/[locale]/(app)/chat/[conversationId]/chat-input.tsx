"use client";

import { encryptForGroup, importPublicKey } from "@openhospi/crypto";
import { Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { sendMessage } from "../chat-actions";
import { fetchPublicKeys } from "../key-actions";

type Props = {
  conversationId: string;
  members: { userId: string; firstName: string; lastName: string; avatarUrl: string | null }[];
  privateKey: CryptoKey;
  onMessageSent: (msg: { id: string; plaintext: string }) => void;
};

export function ChatInput({ conversationId, members, privateKey, onMessageSent }: Props) {
  const t = useTranslations("app.chat");
  const [text, setText] = useState("");
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  function handleSubmit() {
    const trimmed = text.trim();
    if (!trimmed || isPending) return;

    startTransition(async () => {
      // Get public keys of all members
      const memberIds = members.map((m) => m.userId);
      const pubKeys = await fetchPublicKeys(memberIds);

      const recipientKeys = await Promise.all(
        pubKeys.map(async (pk) => ({
          userId: pk.userId,
          publicKey: await importPublicKey(pk.publicKeyJwk),
        })),
      );

      // Encrypt
      const encrypted = await encryptForGroup(trimmed, privateKey, recipientKeys);

      // Send to server — postgres_changes delivers the message to other members
      const { messageId } = await sendMessage(conversationId, {
        ciphertext: encrypted.ciphertext,
        iv: encrypted.iv,
        encryptedKeys: encrypted.encryptedKeys,
      });

      // Optimistic update — show the sent message immediately
      onMessageSent({ id: messageId, plaintext: trimmed });

      setText("");
      inputRef.current?.focus();
    });
  }

  return (
    <div className="border-t p-4">
      <div className="flex items-end gap-2">
        <Textarea
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder={t("message_placeholder")}
          rows={1}
          className="flex-1 resize-none"
        />
        <Button onClick={handleSubmit} disabled={!text.trim() || isPending} size="icon">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
