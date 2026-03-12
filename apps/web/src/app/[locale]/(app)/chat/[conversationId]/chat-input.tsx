"use client";

import type { GroupCiphertextPayload } from "@openhospi/crypto";
import { Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { sendMessage } from "../chat-actions";

type Props = {
  conversationId: string;
  members: { userId: string; firstName: string; lastName: string; avatarUrl: string | null }[];
  currentUserId: string;
  encryptGroupMessage: (
    conversationId: string,
    memberUserIds: string[],
    plaintext: string,
  ) => Promise<GroupCiphertextPayload>;
  onMessageSent: (msg: { id: string; plaintext: string }) => void;
};

export function ChatInput({
  conversationId,
  members,
  currentUserId,
  encryptGroupMessage,
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

      // Encrypt once for the group
      const payload = await encryptGroupMessage(
        conversationId,
        members.map((m) => m.userId),
        trimmed,
      );

      const { messageId } = await sendMessage(conversationId, payload);

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
