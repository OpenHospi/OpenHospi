"use client";

import type { EncryptedMessage } from "@openhospi/crypto";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

import { MessageBubble } from "@/components/app/message-bubble";
import type { MessageItem } from "@/lib/queries/chat";
import { supabase } from "@/lib/supabase/client";

import { markConversationRead } from "../chat-actions";
import { getRealtimeToken } from "../realtime-token-action";

type Props = {
  conversationId: string;
  currentUserId: string;
  initialMessages: MessageItem[];
  members: { userId: string; firstName: string; lastName: string; avatarUrl: string | null }[];
  decryptMessage: (
    conversationId: string,
    senderUserId: string,
    encrypted: EncryptedMessage,
  ) => Promise<string>;
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
  decryptMessage,
  addMessageRef,
}: Props) {
  const t = useTranslations("app.chat");
  const [decryptedMessages, setDecryptedMessages] = useState<DecryptedMessage[]>([]);
  const [isDecrypting, setIsDecrypting] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const seenIdsRef = useRef(new Set<string>());

  const decryptMessages = useCallback(
    async (msgs: MessageItem[]) => {
      const results: DecryptedMessage[] = [];
      for (const msg of msgs) {
        try {
          const encrypted: EncryptedMessage = {
            header: {
              ratchetPublicKey: msg.ratchetPublicKey,
              messageNumber: msg.messageNumber,
              previousChainLength: msg.previousChainLength,
            },
            ciphertext: msg.ciphertext,
            iv: msg.iv,
          };

          const plaintext = await decryptMessage(conversationId, msg.senderId, encrypted);

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
    [conversationId, decryptMessage, t],
  );

  const decryptMessagesRef = useRef(decryptMessages);
  useEffect(() => {
    decryptMessagesRef.current = decryptMessages;
  }, [decryptMessages]);

  const membersRef = useRef(members);
  useEffect(() => {
    membersRef.current = members;
  }, [members]);

  const initialMessagesRef = useRef(initialMessages);
  useEffect(() => {
    initialMessagesRef.current = initialMessages;
  }, [initialMessages]);

  // Initial decryption
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const decrypted = await decryptMessagesRef.current(initialMessagesRef.current);
      if (!cancelled) {
        setDecryptedMessages(decrypted.reverse());
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

  // Supabase Realtime subscription
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
        ratchetPublicKey: row.ratchet_public_key as string,
        messageNumber: row.message_number as number,
        previousChainLength: row.previous_chain_length as number,
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
