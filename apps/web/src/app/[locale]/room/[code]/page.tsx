import { db } from "@openhospi/database";
import { houseMembers, houses, rooms } from "@openhospi/database/schema";
import { RoomStatus } from "@openhospi/shared/enums";
import { count, eq } from "drizzle-orm";
import { Home, MapPin, Users } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation-app";
import { requireSession } from "@/lib/auth-server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; code: string }>;
}): Promise<Metadata> {
  const { locale, code } = await params;
  const t = await getTranslations({ locale, namespace: "app.join" });
  const tEnums = await getTranslations({ locale, namespace: "enums" });

  const room = await getRoomByShareLink(code);
  if (!room || room.status !== RoomStatus.active) return { title: t("title") };

  const cityName = tEnums(`city.${room.city}`);
  return { title: `${room.title} — ${cityName}` };
}

type Props = {
  params: Promise<{ locale: string; code: string }>;
};

async function getRoomByShareLink(code: string) {
  const [room] = await db
    .select({
      id: rooms.id,
      title: rooms.title,
      city: rooms.city,
      status: rooms.status,
      houseId: rooms.houseId,
    })
    .from(rooms)
    .where(eq(rooms.shareLink, code));

  if (!room) return null;

  const [result] = await db
    .select({
      count: count(),
    })
    .from(houseMembers)
    .innerJoin(houses, eq(houseMembers.houseId, houses.id))
    .where(eq(houseMembers.houseId, room.houseId));

  return { ...room, housemateCount: result?.count ?? 0 };
}

export default async function JoinRoomPage({ params }: Props) {
  const { locale, code } = await params;
  setRequestLocale(locale);
  await requireSession();

  const t = await getTranslations({ locale, namespace: "app.join" });
  const tEnums = await getTranslations({ locale, namespace: "enums" });

  const room = await getRoomByShareLink(code);

  if (!room || room.status !== RoomStatus.active) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <Card className="w-full max-w-lg text-center">
          <CardHeader>
            <CardTitle>{t("title")}</CardTitle>
            <CardDescription>{t("errors.INVALID_LINK")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/discover">{t("cancel")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
            <Home className="size-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3 rounded-lg border p-4">
            <h3 className="font-semibold">{room.title || t("title")}</h3>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <MapPin className="size-4" />
                {tEnums(`city.${room.city}`)}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="size-4" />
                {t("housemates", { count: room.housemateCount })}
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button asChild variant="outline" className="flex-1">
              <Link href="/discover">{t("cancel")}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
