"use client";

import { decryptFromGroup, importPublicKey } from "@openhospi/crypto";
import type { EncryptedKey } from "@openhospi/crypto";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

import { MessageBubble } from "@/components/app/message-bubble";
import type { MessageItem } from "@/lib/queries/chat";
import { supabase } from "@/lib/supabase/client";

import { markConversationRead } from "../chat-actions";
import { fetchPublicKeys } from "../key-actions";
import { getRealtimeToken } from "../realtime-token-action";

type Props = {
  conversationId: string;
  currentUserId: string;
  initialMessages: MessageItem[];
  members: { userId: string; firstName: string; lastName: string; avatarUrl: string | null }[];
  privateKey: CryptoKey;
  addMessageRef: React.MutableRefObject<((msg: DecryptedMessage) => void) | null>;
};

export type DecryptedMessage = {
  id: string;
  senderId: string;
  senderFirstName: string;
  senderAvatarUrl: string | null;
  plaintext: string;
  messageType: string;
  createdAt: Date;
};

export function MessageThread({
  conversationId,
  currentUserId,
  initialMessages,
  members,
  privateKey,
  addMessageRef,
}: Props) {
  const t = useTranslations("app.chat");
  const [decryptedMessages, setDecryptedMessages] = useState<DecryptedMessage[]>([]);
  const [isDecrypting, setIsDecrypting] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const seenIdsRef = useRef(new Set<string>());

  const decryptMessages = useCallback(
    async (msgs: MessageItem[]) => {
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
            plaintext: t("key_reset_message"),
            messageType: msg.messageType,
            createdAt: msg.createdAt,
          });
        }
      }
      return results;
    },
    [currentUserId, privateKey, t],
  );

  // Keep a stable ref so the subscription effect doesn't re-run when decryptMessages changes
  const decryptMessagesRef = useRef(decryptMessages);
  useEffect(() => {
    decryptMessagesRef.current = decryptMessages;
  }, [decryptMessages]);

  // Keep members in a ref so the subscription effect doesn't re-run on every render
  const membersRef = useRef(members);
  useEffect(() => {
    membersRef.current = members;
  }, [members]);

  // Keep initialMessages in a ref — only used on mount / conversation change
  const initialMessagesRef = useRef(initialMessages);
  useEffect(() => {
    initialMessagesRef.current = initialMessages;
  }, [initialMessages]);

  // Initial decryption — only re-runs when the conversation changes
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const decrypted = await decryptMessagesRef.current(initialMessagesRef.current);
      if (!cancelled) {
        setDecryptedMessages(decrypted.reverse());
        // Track all initial message IDs for dedup
        for (const msg of decrypted) {
          seenIdsRef.current.add(msg.id);
        }
        setIsDecrypting(false);
        markConversationRead(conversationId);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [decryptedMessages]);

  // Expose addMessage for optimistic updates from ChatInput
  useEffect(() => {
    addMessageRef.current = (msg: DecryptedMessage) => {
      if (seenIdsRef.current.has(msg.id)) return;
      seenIdsRef.current.add(msg.id);
      setDecryptedMessages((prev) => [...prev, msg]);
    };
  });

  // Supabase Realtime subscription via postgres_changes
  useEffect(() => {
    let mounted = true;

    async function handleInsert(row: Record<string, unknown>) {
      const messageId = row.id as string;
      if (seenIdsRef.current.has(messageId)) return;
      seenIdsRef.current.add(messageId);

      const senderId = row.sender_id as string;
      const member = membersRef.current.find((m) => m.userId === senderId);

      const msgItem: MessageItem = {
        id: messageId,
        senderId,
        senderFirstName: member?.firstName ?? "",
        senderAvatarUrl: member?.avatarUrl ?? null,
        ciphertext: row.ciphertext as string,
        iv: row.iv as string,
        encryptedKeys: row.encrypted_keys as unknown,
        messageType: (row.message_type as string) ?? "text",
        createdAt: new Date(row.created_at as string),
      };

      const decrypted = await decryptMessagesRef.current([msgItem]);
      if (!mounted) return;
      setDecryptedMessages((prev) => [...prev, ...decrypted]);
    }

    (async () => {
      const token = await getRealtimeToken();
      if (!mounted) return;
      supabase.realtime.setAuth(token);

      supabase
        .channel(`messages:${conversationId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload) => {
            if (!mounted) return;
            handleInsert(payload.new as Record<string, unknown>);
          },
        )
        .subscribe();
    })();

    return () => {
      mounted = false;
      supabase.removeAllChannels();
    };
  }, [conversationId]);

  // Mark as read when tab becomes visible
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        markConversationRead(conversationId);
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [conversationId]);

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
