"use client";

import { useFormatter, useTranslations } from "next-intl";

import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Link, usePathname } from "@/i18n/navigation-app";
import type { ConversationListItem } from "@/lib/queries/chat";
import { cn } from "@/lib/utils";

type Props = {
  conversations: ConversationListItem[];
  currentUserId: string;
};

export function ConversationList({ conversations, currentUserId }: Props) {
  const t = useTranslations("app.chat");
  const format = useFormatter();
  const pathname = usePathname();

  function formatTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = diff / (1000 * 60 * 60);

    if (hours < 24) {
      return format.dateTime(date, { hour: "2-digit", minute: "2-digit" });
    }
    if (hours < 168) {
      return format.dateTime(date, { weekday: "short" });
    }
    return format.dateTime(date, "short");
  }

  if (conversations.length === 0) {
    return (
      <div className="text-muted-foreground rounded-lg border border-dashed p-8 text-center">
        {t("empty")}
      </div>
    );
  }

  return (
    <div className="divide-y">
      {conversations.map((conv) => {
        const otherMembers = conv.members.filter((m) => m.userId !== currentUserId);
        const displayName =
          conv.roomTitle ?? otherMembers.map((m) => m.firstName).join(", ") ?? t("conversation");
        const isActive = pathname === `/chat/${conv.id}`;

        return (
          <Link
            key={conv.id}
            href={`/chat/${conv.id}`}
            className={cn(
              "flex items-center gap-3 p-4 transition-colors",
              isActive ? "bg-muted" : "hover:bg-muted/50",
            )}
          >
            <UserAvatar
              avatarUrl={otherMembers[0]?.avatarUrl ?? null}
              userName={displayName}
              size="md"
            />
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
                  {conv.lastMessageAt ? t("encrypted_message") : t("no_messages")}
                </span>
                {conv.unreadCount > 0 && (
                  <Badge className="ml-2 h-5 min-w-5 justify-center rounded-full px-1.5 font-medium">
                    {conv.unreadCount}
                  </Badge>
                )}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
