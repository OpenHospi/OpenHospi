"use client";

import { ArrowLeft, Info, Shield } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation-app";

import { ChatInput } from "./chat-input";
import { ConversationInfoPanel } from "./conversation-info-panel";
import { MessageThread } from "./message-thread";

type ConversationDetail = {
  id: string;
  roomId: string;
  roomTitle: string;
  seekerUserId: string;
  members: Array<{ userId: string; firstName: string }>;
};

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
  conversation: ConversationDetail;
  initialMessages: MessageRow[];
  initialCursor: string | null;
  currentUserId: string;
};

export function ChatView({ conversation, initialMessages, initialCursor, currentUserId }: Props) {
  const t = useTranslations("app.chat");
  const [showInfo, setShowInfo] = useState(false);

  const memberUserIds = conversation.members.map((m) => m.userId);

  return (
    <div className="flex w-full">
      {/* Main chat area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <div className="border-border flex items-center gap-3 border-b px-4 py-3">
          <Link href="/chat" className="md:hidden">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>

          <div className="flex min-w-0 flex-1 flex-col">
            <h2 className="truncate text-sm font-semibold">{conversation.roomTitle}</h2>
            <div className="flex items-center gap-1.5">
              <Shield className="text-primary h-3 w-3" />
              <span className="text-muted-foreground text-xs">{t("encrypted")}</span>
            </div>
          </div>

          <Button variant="ghost" size="icon" onClick={() => setShowInfo(!showInfo)}>
            <Info className="h-5 w-5" />
          </Button>
        </div>

        {/* Messages */}
        <MessageThread
          conversationId={conversation.id}
          initialMessages={initialMessages}
          initialCursor={initialCursor}
          currentUserId={currentUserId}
          memberUserIds={memberUserIds}
        />

        {/* Input */}
        <ChatInput
          conversationId={conversation.id}
          memberUserIds={memberUserIds}
          currentUserId={currentUserId}
        />
      </div>

      {/* Info panel */}
      {showInfo && (
        <ConversationInfoPanel
          conversation={conversation}
          currentUserId={currentUserId}
          onClose={() => setShowInfo(false)}
        />
      )}
    </div>
  );
}
