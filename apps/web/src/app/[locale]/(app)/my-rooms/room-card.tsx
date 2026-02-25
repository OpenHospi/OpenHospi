import { FileText, Home } from "lucide-react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import type { RoomSummary } from "@/lib/rooms";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  paused: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  closed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

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
          <Badge className={cn("absolute top-2 right-2", statusColors[room.status])}>
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
