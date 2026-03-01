"use client";

import { decryptFromGroup, importPrivateKey, importPublicKey } from "@openhospi/crypto";
import type { EncryptedKey } from "@openhospi/crypto";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

import { MessageBubble } from "@/components/app/message-bubble";
import type { MessageItem } from "@/lib/chat";
import { getStoredPrivateKey } from "@/lib/crypto-store";
import { supabase } from "@/lib/supabase-client";


import { markConversationRead } from "../chat-actions";
import { fetchPublicKeys } from "../key-actions";

type Props = {
  conversationId: string;
  currentUserId: string;
  initialMessages: MessageItem[];
  members: { userId: string; firstName: string; lastName: string; avatarUrl: string | null }[];
};

type DecryptedMessage = {
  id: string;
  senderId: string;
  senderFirstName: string;
  senderAvatarUrl: string | null;
  plaintext: string;
  messageType: string;
  createdAt: Date;
};

export function MessageThread({ conversationId, currentUserId, initialMessages, members }: Props) {
  const t = useTranslations("app.chat");
  const [decryptedMessages, setDecryptedMessages] = useState<DecryptedMessage[]>([]);
  const [isDecrypting, setIsDecrypting] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const decryptMessages = useCallback(
    async (msgs: MessageItem[]) => {
      const privateKeyJwk = await getStoredPrivateKey(currentUserId);
      if (!privateKeyJwk) return [];

      const privateKey = await importPrivateKey(privateKeyJwk);

      // Fetch public keys for all senders
      const senderIds = [...new Set(msgs.map((m) => m.senderId))];
      const pubKeys = await fetchPublicKeys(senderIds);
      const pubKeyMap = new Map<string, JsonWebKey>();
      for (const pk of pubKeys) {
        pubKeyMap.set(pk.userId, pk.publicKeyJwk);
      }

      const results: DecryptedMessage[] = [];
      for (const msg of msgs) {
        try {
          const senderPubJwk = pubKeyMap.get(msg.senderId);
          if (!senderPubJwk) {
            results.push({
              id: msg.id,
              senderId: msg.senderId,
              senderFirstName: msg.senderFirstName,
              senderAvatarUrl: msg.senderAvatarUrl,
              plaintext: t("decryption_failed"),
              messageType: msg.messageType,
              createdAt: msg.createdAt,
            });
            continue;
          }

          const senderPublicKey = await importPublicKey(senderPubJwk);
          const encryptedKeys = (msg.encryptedKeys ?? []) as EncryptedKey[];
          const plaintext = await decryptFromGroup(
            msg.ciphertext,
            msg.iv,
            encryptedKeys,
            currentUserId,
            privateKey,
            senderPublicKey,
          );

          results.push({
            id: msg.id,
            senderId: msg.senderId,
            senderFirstName: msg.senderFirstName,
            senderAvatarUrl: msg.senderAvatarUrl,
            plaintext,
            messageType: msg.messageType,
            createdAt: msg.createdAt,
          });
        } catch {
          results.push({
            id: msg.id,
            senderId: msg.senderId,
            senderFirstName: msg.senderFirstName,
            senderAvatarUrl: msg.senderAvatarUrl,
            plaintext: t("decryption_failed"),
            messageType: msg.messageType,
            createdAt: msg.createdAt,
          });
        }
      }
      return results;
    },
    [currentUserId, t],
  );

  // Initial decryption
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const decrypted = await decryptMessages(initialMessages);
      if (!cancelled) {
        setDecryptedMessages(decrypted.reverse());
        setIsDecrypting(false);
        // Mark as read
        markConversationRead(conversationId);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialMessages, decryptMessages, conversationId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [decryptedMessages]);

  // Supabase Realtime subscription
  useEffect(() => {
    const channel = supabase.channel(`chat:${conversationId}`);

    channel
      .on("broadcast", { event: "new_message" }, async (payload) => {
        const msg = payload.payload as MessageItem;
        const decrypted = await decryptMessages([msg]);
        setDecryptedMessages((prev) => [...prev, ...decrypted]);
        markConversationRead(conversationId);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, decryptMessages]);

  if (isDecrypting) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <span className="text-muted-foreground text-sm">{t("decrypting")}</span>
      </div>
    );
  }

  if (decryptedMessages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <span className="text-muted-foreground text-sm">{t("no_messages")}</span>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto p-4">
      {decryptedMessages.map((msg) => (
        <MessageBubble
          key={msg.id}
          id={msg.id}
          isOwn={msg.senderId === currentUserId}
          senderId={msg.senderId}
          senderName={msg.senderFirstName}
          senderAvatar={msg.senderAvatarUrl}
          plaintext={msg.plaintext}
          createdAt={msg.createdAt}
        />
      ))}
    </div>
  );
}
