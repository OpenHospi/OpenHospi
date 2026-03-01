"use client";

import { MoreVertical } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import { ReportDialog } from "./report-dialog";

type Props = {
  id: string;
  isOwn: boolean;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  plaintext: string;
  createdAt: Date;
};

export function MessageBubble({ id, isOwn, senderId, senderName, plaintext, createdAt }: Props) {
  const t = useTranslations("app.chat");

  return (
    <div className={cn("group flex", isOwn ? "justify-end" : "justify-start")}>
      <div className="relative flex items-start gap-1">
        {!isOwn && (
          <div className="mt-1 opacity-0 transition-opacity group-hover:opacity-100">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-6">
                  <MoreVertical className="size-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <ReportDialog
                  type="message"
                  targetId={id}
                  reportedUserId={senderId}
                  decryptedMessageText={plaintext}
                  trigger={
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      {t("report_message")}
                    </DropdownMenuItem>
                  }
                />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
        <div
          className={cn(
            "max-w-[75%] rounded-2xl px-4 py-2",
            isOwn ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted rounded-bl-md",
          )}
        >
          {!isOwn && <p className="text-xs font-medium opacity-70">{senderName}</p>}
          <p className="text-sm whitespace-pre-wrap break-words">{plaintext}</p>
          <p className={cn("mt-1 text-[10px] opacity-50", isOwn ? "text-right" : "text-left")}>
            {createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </div>
    </div>
  );
}
