"use client";

import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import type { NotificationItem } from "@/lib/notifications";
import { cn } from "@/lib/utils";

import { markNotificationReadAction, markAllReadAction } from "./notification-actions";


type Props = {
  notifications: NotificationItem[];
};

export function NotificationsList({ notifications }: Props) {
  const t = useTranslations("app.notifications");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const hasUnread = notifications.some((n) => !n.readAt);

  function handleMarkRead(id: string) {
    startTransition(async () => {
      await markNotificationReadAction(id);
      router.refresh();
    });
  }

  function handleMarkAllRead() {
    startTransition(async () => {
      await markAllReadAction();
      router.refresh();
    });
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-12 text-center">
        <Bell className="size-8 text-muted-foreground" />
        <p className="text-muted-foreground">{t("empty")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {hasUnread && (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={handleMarkAllRead} disabled={isPending}>
            {t("markAllRead")}
          </Button>
        </div>
      )}

      <div className="divide-y rounded-lg border">
        {notifications.map((notification) => (
          <button
            key={notification.id}
            type="button"
            className={cn(
              "w-full p-4 text-left transition-colors hover:bg-muted/50",
              !notification.readAt && "bg-primary/5",
            )}
            onClick={() => !notification.readAt && handleMarkRead(notification.id)}
            disabled={isPending}
          >
            <div className="flex items-start gap-3">
              {!notification.readAt && (
                <div className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
              )}
              <div className={cn("min-w-0 flex-1", notification.readAt && "ml-5")}>
                <p className="font-medium">{notification.title}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{notification.body}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(notification.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
