import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation-app";
import { getUnreadNotificationCount } from "@/lib/queries/notifications";

type Props = {
  userId: string;
};

export async function NotificationBell({ userId }: Props) {
  const unreadCount = await getUnreadNotificationCount(userId);

  return (
    <Button variant="ghost" size="icon" className="relative" asChild>
      <Link href="/notifications" aria-label="Notifications">
        <Bell className="size-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Link>
    </Button>
  );
}
