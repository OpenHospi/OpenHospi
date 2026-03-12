"use client";

import { ArrowLeft, Info } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { KeyRecoveryDialog } from "@/components/app/key-recovery-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useEncryption } from "@/hooks/use-encryption";
import { Link } from "@/i18n/navigation-app";
import { sentMessageCache } from "@/lib/crypto/sent-message-cache";
import type { ConversationDetail, MessageItem } from "@/lib/queries/chat";

import { blockUser, unblockUser } from "../block-actions";

import { ChatInput } from "./chat-input";
import { ConversationInfoPanel } from "./conversation-info-panel";
import type { DecryptedMessage } from "./message-thread";
import { MessageThread } from "./message-thread";

type Props = {
  conversationId: string;
  currentUserId: string;
  initialMessages: MessageItem[];
  members: { userId: string; firstName: string; lastName: string; avatarUrl: string | null }[];
  blockedUserIds: string[];
  conversationDetail: ConversationDetail | null;
};

export function ChatView({
  conversationId,
  currentUserId,
  initialMessages,
  members,
  blockedUserIds,
  conversationDetail,
}: Props) {
  const t = useTranslations("app.chat");
  const [isPending, startTransition] = useTransition();
  const { status, encryptGroupMessage, decryptGroupMessage, getFingerprint } =
    useEncryption(currentUserId);
  const addMessageRef = useRef<((msg: DecryptedMessage) => void) | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);

  const currentMember = members.find((m) => m.userId === currentUserId);
  const otherMembers = members.filter((m) => m.userId !== currentUserId);
  const title = otherMembers.map((m) => m.firstName).join(", ") || t("conversation");

  const isBlocked = otherMembers.some((m) => blockedUserIds.includes(m.userId));

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

  if (status === "loading") {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-3 border-b px-4 py-3">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <span className="text-muted-foreground text-sm">{t("decrypting")}</span>
        </div>
      </div>
    );
  }

  if (status === "needs-recovery" || status === "needs-setup") {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-3 border-b px-4 py-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/chat">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-semibold">{title}</h2>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center p-4">
          <KeyRecoveryDialog userId={currentUserId} />
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-3 border-b px-4 py-3">
        <Button variant="ghost" size="icon" asChild className="md:hidden">
          <Link href="/chat">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <button
          type="button"
          className="min-w-0 flex-1 text-left"
          onClick={() => setInfoOpen(true)}
          disabled={!conversationDetail}
        >
          <h2 className="truncate font-semibold">{title}</h2>
          <p className="text-muted-foreground text-xs">
            {t("members_count", { count: members.length })}
          </p>
        </button>
        {conversationDetail && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setInfoOpen(true)}
            disabled={isPending}
          >
            <Info className="size-4" />
          </Button>
        )}
      </div>

      {/* Messages */}
      <MessageThread
        conversationId={conversationId}
        currentUserId={currentUserId}
        initialMessages={initialMessages}
        members={members}
        decryptGroupMessage={decryptGroupMessage}
        addMessageRef={addMessageRef}
      />

      {/* Input */}
      {isBlocked ? (
        <div className="border-t p-4 text-center">
          <p className="text-muted-foreground text-sm">{t("blocked")}</p>
        </div>
      ) : (
        <ChatInput
          conversationId={conversationId}
          members={members}
          currentUserId={currentUserId}
          encryptGroupMessage={encryptGroupMessage}
          onMessageSent={({ id, plaintext }) => {
            sentMessageCache.save(id, plaintext);
            addMessageRef.current?.({
              id,
              senderId: currentUserId,
              senderFirstName: currentMember?.firstName ?? "",
              senderAvatarUrl: currentMember?.avatarUrl ?? null,
              plaintext,
              messageType: "text",
              createdAt: new Date(),
            });
          }}
        />
      )}

      {/* Conversation Info Panel */}
      {conversationDetail && (
        <ConversationInfoPanel
          open={infoOpen}
          onClose={() => setInfoOpen(false)}
          conversationDetail={conversationDetail}
          currentUserId={currentUserId}
          blockedUserIds={blockedUserIds}
          onBlock={handleBlock}
          onUnblock={handleUnblock}
          getFingerprint={getFingerprint}
        />
      )}
    </div>
  );
}
