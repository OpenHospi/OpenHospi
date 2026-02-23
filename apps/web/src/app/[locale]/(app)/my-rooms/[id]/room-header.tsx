import { getTranslations } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import type { Room } from "@/lib/rooms";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  paused: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  closed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

type Props = {
  room: Room;
};

export async function RoomHeader({ room }: Props) {
  const tEnums = await getTranslations("enums");

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">{room.title || "Untitled room"}</h1>
        <Badge className={cn(statusColors[room.status])}>
          {tEnums(`room_status.${room.status}`)}
        </Badge>
      </div>
    </div>
  );
}
