"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { MessageItem } from "@/lib/chat";

import { MessageThread } from "./message-thread";
import { ChatInput } from "./chat-input";

type Props = {
  conversationId: string;
  currentUserId: string;
  initialMessages: MessageItem[];
  members: { userId: string; firstName: string; lastName: string; avatarUrl: string | null }[];
};

export function ChatView({ conversationId, currentUserId, initialMessages, members }: Props) {
  const t = useTranslations("app.chat");

  const otherMembers = members.filter((m) => m.userId !== currentUserId);
  const title = otherMembers.map((m) => m.firstName).join(", ") || t("conversation");

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/chat">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-semibold">{title}</h2>
          <p className="text-muted-foreground text-xs">
            {t("members_count", { count: members.length })}
          </p>
        </div>
      </div>

      {/* Messages */}
      <MessageThread
        conversationId={conversationId}
        currentUserId={currentUserId}
        initialMessages={initialMessages}
        members={members}
      />

      {/* Input */}
      <ChatInput
        conversationId={conversationId}
        currentUserId={currentUserId}
        members={members}
      />
    </div>
  );
}
