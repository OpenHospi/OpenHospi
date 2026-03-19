"use client";

import { Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

import { useEncryption } from "@/hooks/use-encryption";
import { sentMessageCache } from "@/lib/crypto";
import { supabase } from "@/lib/supabase/client";

import { fetchMessageById } from "../chat-actions";

type MessageRow = {
  id: string;
  conversationId: string;
  senderId: string;
  senderDeviceId: string | null;
  messageType: string;
  createdAt: Date;
  payload: string | null;
  senderFirstName: string | null;
};

type Props = {
  conversationId: string;
  initialMessages: MessageRow[];
  initialCursor: string | null;
  currentUserId: string;
  memberUserIds: string[];
};

export function MessageThread({ conversationId, initialMessages, currentUserId }: Props) {
  const t = useTranslations("app.chat");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState(initialMessages);
  const { decryptMessage, processPendingDistributions, deviceId } = useEncryption(currentUserId);
  const [decryptedCache, setDecryptedCache] = useState<Record<string, string>>({});
  const processedRef = useRef(false);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Process pending distributions on mount (before decrypting)
  useEffect(() => {
    if (processedRef.current || !deviceId) return;
    processedRef.current = true;
    processPendingDistributions(deviceId).catch(() => {});
  }, [deviceId, processPendingDistributions]);

  // Decrypt a single message
  const decryptSingle = useCallback(
    async (msg: MessageRow): Promise<string | null> => {
      if (msg.messageType === "system") return msg.payload ?? "";
      if (!msg.payload) return null;

      // Own messages — check local plaintext cache (same as Signal Desktop)
      if (msg.senderId === currentUserId) {
        const cached = await sentMessageCache.get(msg.id);
        if (cached) return cached;
      }

      if (!msg.senderDeviceId) return null;

      try {
        return await decryptMessage(
          msg.id,
          conversationId,
          {
            userId: msg.senderId,
            deviceId: msg.senderDeviceId,
          },
          msg.payload,
        );
      } catch {
        return t("decryption_failed");
      }
    },
    [currentUserId, conversationId, decryptMessage, t],
  );

  // Decrypt messages on mount and when messages change
  useEffect(() => {
    async function decryptAll() {
      const cache: Record<string, string> = { ...decryptedCache };
      let changed = false;

      for (const msg of messages) {
        if (cache[msg.id]) continue;

        const text = await decryptSingle(msg);
        if (text !== null) {
          cache[msg.id] = text;
          changed = true;
        }
      }

      if (changed) {
        setDecryptedCache(cache);
      }
    }

    decryptAll();
  }, [messages]); // eslint-disable-line react-hooks/exhaustive-deps

  // Realtime handlers
  const handleNewMessage = useCallback(
    async (messageId: string) => {
      if (messages.some((m) => m.id === messageId)) return;

      const msg = await fetchMessageById(messageId);
      if (!msg) return;

      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [msg, ...prev]));

      const text = await decryptSingle(msg);
      if (text !== null) {
        setDecryptedCache((prev) => ({ ...prev, [msg.id]: text }));
      }
    },
    [messages, decryptSingle],
  );

  // Supabase Realtime subscription
  useEffect(() => {
    const channel = supabase.channel(`chat:${conversationId}`);

    channel
      .on("broadcast", { event: "new_message" }, (payload) => {
        const { messageId } = payload.payload as { messageId: string };
        handleNewMessage(messageId);
      })
      .on("broadcast", { event: "sender_key_distribution" }, () => {
        if (deviceId) processPendingDistributions(deviceId);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, deviceId, handleNewMessage, processPendingDistributions]);

  return (
    <div ref={scrollRef} className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
      {/* E2EE notice */}
      <div className="text-muted-foreground mx-auto mb-4 flex items-center gap-1.5 text-xs">
        <Lock className="h-3 w-3" />
        <span>{t("encrypted")}</span>
      </div>

      {/* Messages in chronological order (reversed from query) */}
      {[...messages].reverse().map((msg) => {
        const isOwn = msg.senderId === currentUserId;
        const text = decryptedCache[msg.id];

        return (
          <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[75%] rounded-2xl px-3 py-2 ${
                isOwn ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
              }`}
            >
              {!isOwn && msg.senderFirstName && (
                <p className="mb-0.5 text-xs font-medium opacity-70">{msg.senderFirstName}</p>
              )}
              <p className="text-sm">{text ?? "..."}</p>
              <p className="mt-0.5 text-right text-[10px] opacity-50">
                {new Date(msg.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
