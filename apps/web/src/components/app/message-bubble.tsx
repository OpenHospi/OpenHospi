"use client";

import { cn } from "@/lib/utils";

type Props = {
  isOwn: boolean;
  senderName: string;
  senderAvatar: string | null;
  plaintext: string;
  createdAt: Date;
};

export function MessageBubble({ isOwn, senderName, plaintext, createdAt }: Props) {
  return (
    <div className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-2",
          isOwn
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-muted rounded-bl-md",
        )}
      >
        {!isOwn && (
          <p className="text-xs font-medium opacity-70">{senderName}</p>
        )}
        <p className="text-sm whitespace-pre-wrap break-words">{plaintext}</p>
        <p className={cn("mt-1 text-[10px] opacity-50", isOwn ? "text-right" : "text-left")}>
          {createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}
