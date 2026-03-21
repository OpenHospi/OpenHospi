import { STORAGE_BUCKET_ROOM_PHOTOS } from "@openhospi/shared/constants";
import { RentalType } from "@openhospi/shared/enums";
import { Calendar, Home, Maximize2, Users } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";

import { StorageImage } from "@/components/shared/storage-image";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DiscoverRoom } from "@/lib/queries/discover";

type Props = {
  room: DiscoverRoom;
};

export async function RoomCard({ room }: Props) {
  const tCommon = await getTranslations("common.labels");
  const tCard = await getTranslations("app.discover.card");
  const tEnums = await getTranslations("enums");
  const format = await getFormatter();

  const isShortTerm =
    room.rentalType === RentalType.sublet || room.rentalType === RentalType.temporary;
  const isAvailableNow = room.availableFrom != null && new Date(room.availableFrom) <= new Date();

  return (
    <Card className="overflow-hidden pt-0 transition-shadow hover:shadow-md">
      {/* Image */}
      <div className="relative aspect-4/3 bg-muted">
        {room.coverPhotoUrl ? (
          <StorageImage
            src={room.coverPhotoUrl}
            alt={room.title}
            bucket={STORAGE_BUCKET_ROOM_PHOTOS}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <Home className="size-8 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Title + City + Badges */}
      <CardHeader>
        <CardTitle className="truncate">{room.title}</CardTitle>
        <CardDescription className="flex items-center gap-2">
          {tEnums(`city.${room.city}`)}
          {room.houseType && (
            <Badge variant="secondary">{tEnums(`house_type.${room.houseType}`)}</Badge>
          )}
          {room.rentalType === RentalType.sublet && (
            <Badge className="bg-blue-500/90 text-white hover:bg-blue-500/90">
              {tEnums(`rental_type.${room.rentalType}`)}
            </Badge>
          )}
          {room.rentalType === RentalType.temporary && (
            <Badge className="bg-amber-500/90 text-white hover:bg-amber-500/90">
              {tEnums(`rental_type.${room.rentalType}`)}
            </Badge>
          )}
        </CardDescription>
      </CardHeader>

      {/* Availability */}
      {room.availableFrom && (
        <CardContent>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Calendar className="size-3.5 shrink-0" />
            {isAvailableNow ? (
              <span className="flex items-center gap-1.5">
                {tCard("availableNow")}
                <span className="size-2 rounded-full bg-emerald-500" />
              </span>
            ) : (
              <span>
                {tCard("availableFrom", {
                  date: format.dateTime(new Date(room.availableFrom), "short"),
                })}
              </span>
            )}
            {isShortTerm && room.availableUntil && (
              <span>
                &middot;{" "}
                {tCard("until", {
                  date: format.dateTime(new Date(room.availableUntil), "short"),
                })}
              </span>
            )}
          </div>
        </CardContent>
      )}

      {/* Footer */}
      <CardFooter className="mt-auto justify-between border-t text-sm">
        <span className="font-semibold">
          &euro;{room.totalCost}
          <span className="font-normal text-muted-foreground">{tCommon("perMonth")}</span>
        </span>
        <span className="flex items-center gap-1 text-muted-foreground">
          {room.roomSizeM2 != null && (
            <>
              <Maximize2 className="size-3.5" />
              <span>{room.roomSizeM2} m²</span>
            </>
          )}
          {room.totalHousemates != null && (
            <>
              {room.roomSizeM2 != null && <span>&middot;</span>}
              <Users className="size-3.5" />
              <span>{room.totalHousemates}</span>
            </>
          )}
        </span>
      </CardFooter>
    </Card>
  );
}
