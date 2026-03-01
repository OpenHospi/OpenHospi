"use client";

import { encryptForGroup, importPrivateKey, importPublicKey } from "@openhospi/crypto";
import { Send } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getStoredPrivateKey } from "@/lib/crypto-store";
import { supabase } from "@/lib/supabase-client";

import { fetchPublicKeys } from "../key-actions";
import { sendMessage } from "../chat-actions";

type Props = {
  conversationId: string;
  currentUserId: string;
  members: { userId: string; firstName: string; lastName: string; avatarUrl: string | null }[];
};

export function ChatInput({ conversationId, currentUserId, members }: Props) {
  const t = useTranslations("app.chat");
  const [text, setText] = useState("");
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  function handleSubmit() {
    const trimmed = text.trim();
    if (!trimmed || isPending) return;

    startTransition(async () => {
      // Load keys
      const privateKeyJwk = await getStoredPrivateKey(currentUserId);
      if (!privateKeyJwk) return;

      const privateKey = await importPrivateKey(privateKeyJwk);

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

      // Send to server
      const result = await sendMessage(conversationId, {
        ciphertext: encrypted.ciphertext,
        iv: encrypted.iv,
        encryptedKeys: encrypted.encryptedKeys,
      });

      // Broadcast via Realtime
      const channel = supabase.channel(`chat:${conversationId}`);
      await channel.send({
        type: "broadcast",
        event: "new_message",
        payload: {
          id: result.messageId,
          senderId: currentUserId,
          senderFirstName: members.find((m) => m.userId === currentUserId)?.firstName ?? "",
          senderAvatarUrl: members.find((m) => m.userId === currentUserId)?.avatarUrl ?? null,
          ciphertext: encrypted.ciphertext,
          iv: encrypted.iv,
          encryptedKeys: encrypted.encryptedKeys,
          messageType: "text",
          createdAt: new Date(),
        },
      });

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
