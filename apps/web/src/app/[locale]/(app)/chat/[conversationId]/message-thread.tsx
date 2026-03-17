"use client";

import { Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { useEncryption } from "@/hooks/use-encryption";

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

export function MessageThread({
  conversationId,
  initialMessages,
  initialCursor,
  currentUserId,
  memberUserIds,
}: Props) {
  const t = useTranslations("app.chat");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState(initialMessages);
  const { decryptMessage, sentMessageCache } = useEncryption(currentUserId);
  const [decryptedCache, setDecryptedCache] = useState<Record<string, string>>({});

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Decrypt messages on mount
  useEffect(() => {
    async function decryptAll() {
      const cache: Record<string, string> = {};

      for (const msg of messages) {
        if (msg.messageType === "system") {
          cache[msg.id] = msg.payload ?? "";
          continue;
        }

        if (!msg.payload) continue;

        // Check sent message cache first (own messages)
        if (msg.senderId === currentUserId) {
          const cached = await sentMessageCache.get(msg.id);
          if (cached) {
            cache[msg.id] = cached;
            continue;
          }
        }

        // Try to decrypt
        try {
          if (!msg.senderDeviceId) continue;
          const plaintext = await decryptMessage(
            msg.id,
            conversationId,
            {
              userId: msg.senderId,
              deviceId: msg.senderDeviceId,
            },
            msg.payload,
          );
          cache[msg.id] = plaintext;
        } catch {
          cache[msg.id] = t("decryption_failed");
        }
      }

      setDecryptedCache(cache);
    }

    decryptAll();
  }, [messages, currentUserId, conversationId, decryptMessage, sentMessageCache, t]);

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
