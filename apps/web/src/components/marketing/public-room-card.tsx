import { Home, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { StorageImage } from "@/components/storage-image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import type { DiscoverRoom } from "@/lib/discover";

type Props = {
  room: DiscoverRoom;
};

export async function PublicRoomCard({ room }: Props) {
  const tCommon = await getTranslations("common.labels");
  const tEnums = await getTranslations("enums");

  return (
    <Link href={`/rooms/${room.id}`}>
      <Card className="overflow-hidden transition-shadow hover:shadow-md">
        <div className="relative aspect-video bg-muted">
          {room.coverPhotoUrl ? (
            <StorageImage
              src={room.coverPhotoUrl}
              alt={room.title}
              bucket="room-photos"
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center">
              <Home className="size-8 text-muted-foreground" />
            </div>
          )}
          {room.houseType && (
            <Badge variant="secondary" className="absolute top-2 left-2">
              {tEnums(`house_type.${room.houseType}`)}
            </Badge>
          )}
        </div>
        <CardHeader className="pb-2">
          <h3 className="truncate font-semibold">{room.title}</h3>
          <p className="text-sm text-muted-foreground">{tEnums(`city.${room.city}`)}</p>
        </CardHeader>
        <CardContent className="flex items-center justify-between text-sm">
          <span className="font-semibold">
            €{room.totalCost}
            <span className="font-normal text-muted-foreground">{tCommon("perMonth")}</span>
          </span>
          <span className="flex items-center gap-1 text-muted-foreground">
            {room.roomSizeM2 && <span>{room.roomSizeM2} m²</span>}
            {room.totalHousemates != null && (
              <>
                {room.roomSizeM2 && <span>·</span>}
                <Users className="size-3.5" />
                <span>{room.totalHousemates}</span>
              </>
            )}
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}
