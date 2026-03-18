"use client";

import { Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { useEncryption } from "@/hooks/use-encryption";
import { sentMessageCache } from "@/lib/crypto";

import { sendMessageWithDistributions } from "../chat-actions";

type Props = {
  conversationId: string;
  memberUserIds: string[];
  currentUserId: string;
};

export function ChatInput({ conversationId, memberUserIds, currentUserId }: Props) {
  const t = useTranslations("app.chat");
  const [text, setText] = useState("");
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { encryptMessage } = useEncryption(currentUserId);

  function handleSubmit() {
    const trimmed = text.trim();
    if (!trimmed || isPending) return;

    setText("");

    startTransition(async () => {
      try {
        const result = await encryptMessage(conversationId, memberUserIds, trimmed);

        // Atomic send: distributions + message in one server call
        const msg = await sendMessageWithDistributions(
          conversationId,
          result.payload,
          result.deviceId,
          result.distributions,
        );

        // Cache plaintext locally for own message display (same as Signal)
        await sentMessageCache.store(msg.id, trimmed);
      } catch (err) {
        console.error("[ChatInput] Send failed:", err);
        setText(trimmed);
      }
    });

    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="border-border border-t p-3">
      <div className="flex items-end gap-2">
        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("message_placeholder")}
          rows={1}
          className="bg-muted placeholder:text-muted-foreground max-h-32 min-h-10 flex-1 resize-none rounded-xl px-3 py-2 text-sm focus:outline-none"
          disabled={isPending}
        />
        <Button
          size="icon"
          onClick={handleSubmit}
          disabled={!text.trim() || isPending}
          className="shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
