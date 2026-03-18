"use client";

import { formatDistanceToNow } from "date-fns";
import { Shield } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation-app";

type ConversationSummary = {
  id: string;
  roomId: string;
  roomTitle: string;
  unreadCount: number;
  lastMessageAt: Date;
  members: Array<{ userId: string; firstName: string }>;
  roomPhotoUrl: string | null;
};

type Props = {
  conversations: ConversationSummary[];
  currentUserId: string;
};

export function ConversationList({ conversations, currentUserId }: Props) {
  const t = useTranslations("app.chat");

  if (conversations.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6">
        <Shield className="text-muted-foreground h-10 w-10" />
        <p className="text-muted-foreground text-center text-sm">{t("no_conversations")}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {conversations.map((conv) => {
        const otherMembers = conv.members.filter((m) => m.userId !== currentUserId);
        const displayName =
          otherMembers.length > 0
            ? otherMembers.map((m) => m.firstName).join(", ")
            : conv.roomTitle;

        return (
          <Link
            key={conv.id}
            href={`/chat/${conv.id}`}
            className="hover:bg-muted/50 flex items-center gap-3 border-b p-3 transition-colors"
          >
            {/* Avatar placeholder */}
            <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-medium">
              {displayName.charAt(0).toUpperCase()}
            </div>

            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-center justify-between">
                <span className="truncate text-sm font-medium">{conv.roomTitle}</span>
                <span className="text-muted-foreground shrink-0 text-xs">
                  {formatDistanceToNow(conv.lastMessageAt, { addSuffix: true })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground truncate text-xs">{displayName}</span>
                {conv.unreadCount > 0 && (
                  <Badge variant="default" className="ml-1 shrink-0 text-xs">
                    {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
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
