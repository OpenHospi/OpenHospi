"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { RoomDetail } from "../../actions";

type Props = {
  room: RoomDetail;
  children: React.ReactNode;
};

export function RoomDetailDialog({ room, children }: Props) {
  const t = useTranslations("admin.reports");
  const tCommon = useTranslations("common.labels");
  const tEnums = useTranslations("enums");

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("roomDetails")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {room.coverPhotoUrl && (
            <div className="relative aspect-video overflow-hidden rounded-lg">
              <Image
                src={room.coverPhotoUrl}
                alt={room.title}
                fill
                className="object-cover"
              />
            </div>
          )}
          <div className="space-y-3">
            <div>
              <p className="text-muted-foreground text-sm">{tCommon("title")}</p>
              <p className="font-medium">{room.title}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">{tCommon("city")}</p>
              <p className="font-medium">{tEnums(`city.${room.city}`)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">{tCommon("rentPrice")}</p>
              <p className="font-medium">&euro;{Number(room.rentPrice).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">{tCommon("status")}</p>
              <Badge>{tEnums(`room_status.${room.status}`)}</Badge>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">{tCommon("owner")}</p>
              <p className="font-medium">{room.ownerName}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
