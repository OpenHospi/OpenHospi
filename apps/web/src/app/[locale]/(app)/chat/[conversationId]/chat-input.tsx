"use client";

import type { EncryptResult } from "@openhospi/crypto";
import { Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import type { CiphertextPayload } from "../chat-actions";
import { sendMessage } from "../chat-actions";

type Props = {
  conversationId: string;
  members: { userId: string; firstName: string; lastName: string; avatarUrl: string | null }[];
  currentUserId: string;
  encryptMessage: (
    conversationId: string,
    recipientUserId: string,
    plaintext: string,
  ) => Promise<EncryptResult>;
  encryptForSelf: (plaintext: string) => Promise<{ ciphertext: string; iv: string }>;
  onMessageSent: (msg: { id: string; plaintext: string }) => void;
};

export function ChatInput({
  conversationId,
  members,
  currentUserId,
  encryptMessage,
  encryptForSelf,
  onMessageSent,
}: Props) {
  const t = useTranslations("app.chat");
  const [text, setText] = useState("");
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  function handleSubmit() {
    const trimmed = text.trim();
    if (!trimmed || isPending) return;

    startTransition(async () => {
      const otherMembers = members.filter((m) => m.userId !== currentUserId);
      if (otherMembers.length === 0) return;

      // Encrypt for all other members (pairwise Double Ratchet)
      const payloads: CiphertextPayload[] = await Promise.all(
        otherMembers.map(async (member) => {
          const result = await encryptMessage(conversationId, member.userId, trimmed);
          return {
            recipientUserId: member.userId,
            ciphertext: result.encrypted.ciphertext,
            iv: result.encrypted.iv,
            ratchetPublicKey: result.encrypted.header.ratchetPublicKey,
            messageNumber: result.encrypted.header.messageNumber,
            previousChainLength: result.encrypted.header.previousChainLength,
            ephemeralPublicKey: result.x3dhMeta?.ephemeralPublicKey,
            senderIdentityKey: result.x3dhMeta?.senderIdentityKey,
            usedSignedPreKeyId: result.x3dhMeta?.usedSignedPreKeyId,
            usedOneTimePreKeyId: result.x3dhMeta?.usedOneTimePreKeyId,
          };
        }),
      );

      // Encrypt for self (HKDF-derived key)
      const selfEncrypted = await encryptForSelf(trimmed);
      payloads.push({
        recipientUserId: currentUserId,
        ciphertext: selfEncrypted.ciphertext,
        iv: selfEncrypted.iv,
        ratchetPublicKey: "self",
        messageNumber: 0,
        previousChainLength: 0,
      });

      const { messageId } = await sendMessage(conversationId, payloads);

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
