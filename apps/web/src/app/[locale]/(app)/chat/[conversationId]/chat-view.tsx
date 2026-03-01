"use client";

import { Flag, MoreVertical, ShieldBan, ShieldCheck, ArrowLeft  } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { toast } from "sonner";

import { ReportDialog } from "@/components/app/report-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { MessageItem } from "@/lib/chat";

import { blockUser, unblockUser } from "../block-actions";

import { ChatInput } from "./chat-input";
import { MessageThread } from "./message-thread";

type Props = {
  conversationId: string;
  currentUserId: string;
  initialMessages: MessageItem[];
  members: { userId: string; firstName: string; lastName: string; avatarUrl: string | null }[];
  blockedUserIds: string[];
};

export function ChatView({
  conversationId,
  currentUserId,
  initialMessages,
  members,
  blockedUserIds,
}: Props) {
  const t = useTranslations("app.chat");
  const [isPending, startTransition] = useTransition();

  const otherMembers = members.filter((m) => m.userId !== currentUserId);
  const title = otherMembers.map((m) => m.firstName).join(", ") || t("conversation");

  // Check if any other member is blocked by the current user
  const blockedMember = otherMembers.find((m) => blockedUserIds.includes(m.userId));
  const isBlocked = !!blockedMember;

  function handleBlock(userId: string) {
    startTransition(async () => {
      try {
        await blockUser(userId);
        toast.success(t("block_user"));
      } catch {
        toast.error("Error");
      }
    });
  }

  function handleUnblock(userId: string) {
    startTransition(async () => {
      try {
        await unblockUser(userId);
        toast.success(t("unblock_user"));
      } catch {
        toast.error("Error");
      }
    });
  }

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

        {otherMembers.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" disabled={isPending}>
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {otherMembers.map((member) => (
                <div key={member.userId}>
                  {blockedUserIds.includes(member.userId) ? (
                    <DropdownMenuItem onClick={() => handleUnblock(member.userId)}>
                      <ShieldCheck className="mr-2 size-4" />
                      {t("unblock_user")}
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => handleBlock(member.userId)}>
                      <ShieldBan className="mr-2 size-4" />
                      {t("block_user")}
                    </DropdownMenuItem>
                  )}
                </div>
              ))}
              <DropdownMenuSeparator />
              {otherMembers.map((member) => (
                <ReportDialog
                  key={`report-${member.userId}`}
                  type="user"
                  targetId={member.userId}
                  trigger={
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <Flag className="mr-2 size-4" />
                      {t("report_user", { name: member.firstName })}
                    </DropdownMenuItem>
                  }
                />
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Messages */}
      <MessageThread
        conversationId={conversationId}
        currentUserId={currentUserId}
        initialMessages={initialMessages}
        members={members}
      />

      {/* Input */}
      {isBlocked ? (
        <div className="border-t p-4 text-center">
          <p className="text-muted-foreground text-sm">{t("blocked")}</p>
        </div>
      ) : (
        <ChatInput
          conversationId={conversationId}
          currentUserId={currentUserId}
          members={members}
        />
      )}
    </div>
  );
}
