"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";

import type { ConversationListItem } from "@/lib/chat";

type Props = {
  conversations: ConversationListItem[];
  currentUserId: string;
};

export function ConversationList({ conversations, currentUserId }: Props) {
  const t = useTranslations("app.chat");

  if (conversations.length === 0) {
    return (
      <div className="text-muted-foreground rounded-lg border border-dashed p-8 text-center">
        {t("empty")}
      </div>
    );
  }

  return (
    <div className="divide-y rounded-lg border">
      {conversations.map((conv) => {
        const otherMembers = conv.members.filter((m) => m.userId !== currentUserId);
        const displayName =
          conv.roomTitle ??
          otherMembers.map((m) => m.firstName).join(", ") ??
          t("conversation");

        return (
          <Link
            key={conv.id}
            href={`/chat/${conv.id}`}
            className="hover:bg-muted/50 flex items-center gap-3 p-4 transition-colors"
          >
            <div className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-medium">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="truncate font-medium">{displayName}</span>
                {conv.lastMessageAt && (
                  <span className="text-muted-foreground text-xs">
                    {formatTime(conv.lastMessageAt)}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground truncate text-sm">
                  {conv.lastMessage ? t("encrypted_message") : t("no_messages")}
                </span>
                {conv.unreadCount > 0 && (
                  <span className="bg-primary text-primary-foreground ml-2 flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-medium">
                    {conv.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = diff / (1000 * 60 * 60);

  if (hours < 24) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (hours < 168) {
    return date.toLocaleDateString([], { weekday: "short" });
  }
  return date.toLocaleDateString([], { day: "numeric", month: "short" });
}
