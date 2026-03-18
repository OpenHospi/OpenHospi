"use client";

import { Shield, UserCircle, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

type ConversationDetail = {
  id: string;
  roomId: string;
  roomTitle: string;
  seekerUserId: string;
  members: Array<{ userId: string; firstName: string }>;
};

type Props = {
  conversation: ConversationDetail;
  currentUserId: string;
  onClose: () => void;
};

export function ConversationInfoPanel({ conversation, currentUserId, onClose }: Props) {
  const t = useTranslations("app.chat");

  return (
    <div className="border-border flex w-72 shrink-0 flex-col border-l">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <h3 className="text-sm font-semibold">{t("info")}</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Separator />

      {/* Room info */}
      <div className="p-4">
        <h4 className="mb-1 text-sm font-medium">{conversation.roomTitle}</h4>
        <div className="flex items-center gap-1.5">
          <Shield className="text-primary h-3.5 w-3.5" />
          <span className="text-muted-foreground text-xs">{t("encrypted")}</span>
        </div>
      </div>

      <Separator />

      {/* Members */}
      <div className="p-4">
        <h4 className="text-muted-foreground mb-3 text-xs font-medium uppercase">
          {t("members")} ({conversation.members.length})
        </h4>
        <div className="flex flex-col gap-2">
          {conversation.members.map((member) => (
            <div key={member.userId} className="flex items-center gap-2">
              <UserCircle className="text-muted-foreground h-5 w-5" />
              <span className="text-sm">
                {member.firstName}
                {member.userId === currentUserId && (
                  <span className="text-muted-foreground ml-1 text-xs">({t("you")})</span>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
