import { Home, Users } from "lucide-react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import type { DiscoverRoom } from "@/lib/discover";

type Props = {
  room: DiscoverRoom;
};

export async function PublicRoomCard({ room }: Props) {
  const t = await getTranslations("public.room");
  const tEnums = await getTranslations("enums");

  return (
    <Link href={`/rooms/${room.id}`}>
      <Card className="overflow-hidden transition-shadow hover:shadow-md">
        <div className="relative aspect-video bg-muted">
          {room.cover_photo_url ? (
            <Image
              src={room.cover_photo_url}
              alt={room.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center">
              <Home className="size-8 text-muted-foreground" />
            </div>
          )}
          {room.house_type && (
            <Badge variant="secondary" className="absolute top-2 left-2">
              {tEnums(`house_type.${room.house_type}`)}
            </Badge>
          )}
        </div>
        <CardHeader className="pb-2">
          <h3 className="truncate font-semibold">{room.title}</h3>
          <p className="text-sm text-muted-foreground">
            {tEnums(`city.${room.city}`)}
          </p>
        </CardHeader>
        <CardContent className="flex items-center justify-between text-sm">
          <span className="font-semibold">
            €{room.rent_price}
            <span className="font-normal text-muted-foreground">{t("perMonth")}</span>
          </span>
          <span className="flex items-center gap-1 text-muted-foreground">
            {room.room_size_m2 && <span>{room.room_size_m2} m²</span>}
            {room.total_housemates != null && (
              <>
                {room.room_size_m2 && <span>·</span>}
                <Users className="size-3.5" />
                <span>{room.total_housemates}</span>
              </>
            )}
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}
