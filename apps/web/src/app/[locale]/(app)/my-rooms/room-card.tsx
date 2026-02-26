import { FileText, Home } from "lucide-react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Link } from "@/i18n/navigation-app";
import type { RoomSummary } from "@/lib/rooms";
import { ROOM_STATUS_COLORS } from "@/lib/status-colors";
import { cn } from "@/lib/utils";

type Props = {
  room: RoomSummary;
};

export async function RoomCard({ room }: Props) {
  const t = await getTranslations("app.rooms");
  const tEnums = await getTranslations("enums");

  return (
    <Link href={`/my-rooms/${room.id}`}>
      <Card className="overflow-hidden transition-shadow hover:shadow-md">
        <div className="relative aspect-video bg-muted">
          {room.coverPhotoUrl ? (
            <Image
              src={room.coverPhotoUrl}
              alt={room.title || "Room"}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center">
              <Home className="size-8 text-muted-foreground" />
            </div>
          )}
          <Badge className={cn("absolute top-2 right-2", ROOM_STATUS_COLORS[room.status])}>
            {tEnums(`room_status.${room.status}`)}
          </Badge>
        </div>
        <CardHeader className="pb-2">
          <h3 className="truncate font-semibold">{room.title || t("wizard.steps.basicInfo")}</h3>
        </CardHeader>
        <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{tEnums(`city.${room.city}`)}</span>
          <span className="flex items-center gap-2">
            {room.applicantCount > 0 && (
              <span className="flex items-center gap-1">
                <FileText className="size-3.5" />
                {room.applicantCount}
              </span>
            )}
            <span>€{room.rentPrice}/mo</span>
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}
