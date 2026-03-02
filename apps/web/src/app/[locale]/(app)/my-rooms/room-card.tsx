import { FileText, Home } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { StorageImage } from "@/components/storage-image";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
      <Card className="overflow-hidden pt-0 transition-shadow hover:shadow-md">
        <div className="relative aspect-4/3 bg-muted">
          {room.coverPhotoUrl ? (
            <StorageImage
              src={room.coverPhotoUrl}
              alt={room.title || "Room"}
              bucket="room-photos"
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center">
              <Home className="size-8 text-muted-foreground" />
            </div>
          )}
        </div>
        <CardHeader>
          <CardTitle className="truncate">{room.title || t("wizard.steps.basicInfo")}</CardTitle>
          <CardDescription className="flex items-center gap-2">
            {tEnums(`city.${room.city}`)}
            <Badge className={cn(ROOM_STATUS_COLORS[room.status])}>
              {tEnums(`room_status.${room.status}`)}
            </Badge>
          </CardDescription>
        </CardHeader>
        <CardFooter className="mt-auto justify-between border-t text-sm text-muted-foreground">
          <span>€{room.totalCost}/mo</span>
          {room.applicantCount > 0 && (
            <span className="flex items-center gap-1">
              <FileText className="size-3.5" />
              {room.applicantCount}
            </span>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
}
