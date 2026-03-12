"use client";

import type { GroupCiphertextPayload } from "@openhospi/crypto";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

import { MessageBubble } from "@/components/app/message-bubble";
import { sentMessageCache } from "@/lib/crypto/sent-message-cache";
import type { MessageItem } from "@/lib/queries/chat";
import { supabase } from "@/lib/supabase/client";

import { markConversationRead } from "../chat-actions";
import { getRealtimeToken } from "../realtime-token-action";

type Props = {
  conversationId: string;
  currentUserId: string;
  initialMessages: MessageItem[];
  members: { userId: string; firstName: string; lastName: string; avatarUrl: string | null }[];
  decryptGroupMessage: (
    conversationId: string,
    senderUserId: string,
    payload: GroupCiphertextPayload,
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
  decryptGroupMessage,
  addMessageRef,
}: Props) {
  const t = useTranslations("app.chat");
  const [decryptedMessages, setDecryptedMessages] = useState<DecryptedMessage[]>([]);
  const [isDecrypting, setIsDecrypting] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const seenIdsRef = useRef(new Set<string>());

  const decryptMessages = useCallback(
    async (msgs: MessageItem[]) => {
      // Batch-fetch cached plaintext for own messages
      const ownMsgIds = msgs.filter((m) => m.senderId === currentUserId).map((m) => m.id);
      const cachedPlaintexts = await sentMessageCache.getMultiple(ownMsgIds);

      const results: DecryptedMessage[] = [];
      for (const msg of msgs) {
        if (!msg.ciphertext || !msg.iv || !msg.signature || msg.chainIteration == null) continue;

        const baseMsg = {
          id: msg.id,
          senderId: msg.senderId,
          senderFirstName: msg.senderFirstName,
          senderAvatarUrl: msg.senderAvatarUrl,
          messageType: msg.messageType,
          createdAt: msg.createdAt,
        };

        // Skip decryption for own messages — use cached plaintext
        if (msg.senderId === currentUserId) {
          const cached = cachedPlaintexts.get(msg.id);
          results.push({
            ...baseMsg,
            plaintext: cached ?? t("own_message_unavailable"),
          });
          continue;
        }

        try {
          const payload: GroupCiphertextPayload = {
            ciphertext: msg.ciphertext,
            iv: msg.iv,
            signature: msg.signature,
            chainIteration: msg.chainIteration,
            chainId: msg.chainId ?? "",
          };
          const plaintext = await decryptGroupMessage(conversationId, msg.senderId, payload);
          results.push({ ...baseMsg, plaintext });
        } catch (error) {
          console.error("[MessageThread] Decryption failed for message", msg.id, error);
          results.push({ ...baseMsg, plaintext: t("key_reset_message") });
        }
      }
      return results;
    },
    [conversationId, currentUserId, decryptGroupMessage, t],
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

  // Supabase Realtime subscription — subscribe to message_payloads for this conversation
  useEffect(() => {
    let mounted = true;

    async function handlePayloadInsert(row: Record<string, unknown>) {
      const messageId = row.message_id as string;
      if (seenIdsRef.current.has(messageId)) return;
      seenIdsRef.current.add(messageId);

      const senderUserId = row.sender_user_id as string;

      // Skip own messages — optimistic add already covers them
      if (senderUserId === currentUserId) return;

      const ciphertext = row.ciphertext as string;
      const iv = row.iv as string;
      const signature = row.signature as string;
      const chainIteration = row.chain_iteration as number;
      const chainId = (row.chain_id as string) ?? "";
      const createdAt = row.created_at ? new Date(row.created_at as string) : new Date();

      const member = membersRef.current.find((m) => m.userId === senderUserId);

      try {
        const plaintext = await decryptMessagesRef.current([
          {
            id: messageId,
            senderId: senderUserId,
            senderFirstName: member?.firstName ?? "",
            senderAvatarUrl: member?.avatarUrl ?? null,
            ciphertext,
            iv,
            signature,
            chainIteration,
            chainId,
            messageType: "text",
            createdAt,
          },
        ]);

        if (!mounted) return;
        setDecryptedMessages((prev) => [...prev, ...plaintext]);
      } catch (error) {
        console.error("[MessageThread] Realtime decryption failed", error);
        if (!mounted) return;
        setDecryptedMessages((prev) => [
          ...prev,
          {
            id: messageId,
            senderId: senderUserId,
            senderFirstName: member?.firstName ?? "",
            senderAvatarUrl: member?.avatarUrl ?? null,
            plaintext: t("key_reset_message"),
            messageType: "text",
            createdAt,
          },
        ]);
      }
    }

    (async () => {
      const token = await getRealtimeToken();
      if (!mounted) return;
      supabase.realtime.setAuth(token);

      supabase
        .channel(`payloads:${conversationId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "message_payloads",
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload) => {
            if (!mounted) return;
            handlePayloadInsert(payload.new as Record<string, unknown>);
          },
        )
        .subscribe();
    })();

    return () => {
      mounted = false;
      supabase.removeAllChannels();
    };
  }, [conversationId, currentUserId, t]);

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
