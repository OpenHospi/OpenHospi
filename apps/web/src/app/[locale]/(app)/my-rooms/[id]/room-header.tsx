import { getTranslations } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import type { Room } from "@/lib/queries/rooms";
import { ROOM_STATUS_COLORS } from "@/lib/status-colors";
import { cn } from "@/lib/utils";

type Props = {
  room: Room;
};

export async function RoomHeader({ room }: Props) {
  const tEnums = await getTranslations("enums");

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">{room.title || "Untitled room"}</h1>
        <Badge className={cn(ROOM_STATUS_COLORS[room.status])}>
          {tEnums(`room_status.${room.status}`)}
        </Badge>
      </div>
    </div>
  );
}
