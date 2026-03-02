import { db } from "@openhospi/database";
import { houseMembers, houses, rooms } from "@openhospi/database/schema";
import type { Locale } from "@openhospi/i18n";
import { RoomStatus } from "@openhospi/shared/enums";
import { count, eq, sql } from "drizzle-orm";
import { Home, MapPin, Users } from "lucide-react";
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation-app";
import { routing } from "@/i18n/routing";
import { requireSession } from "@/lib/auth-server";

async function getRoomByShareLink(code: string) {
  const [room] = await db
    .select({
      id: rooms.id,
      title: rooms.title,
      city: rooms.city,
      status: rooms.status,
      houseId: rooms.houseId,
      shareLinkExpiresAt: rooms.shareLinkExpiresAt,
      shareLinkMaxUses: rooms.shareLinkMaxUses,
      shareLinkUseCount: rooms.shareLinkUseCount,
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

type ShareLinkError = "INVALID_LINK" | "LINK_EXPIRED" | "LINK_MAX_USED" | "ROOM_NOT_ACTIVE";

function validateShareLink(room: NonNullable<Awaited<ReturnType<typeof getRoomByShareLink>>>): ShareLinkError | null {
  if (room.status !== RoomStatus.active) return "ROOM_NOT_ACTIVE";

  if (room.shareLinkExpiresAt && new Date(room.shareLinkExpiresAt) < new Date()) {
    return "LINK_EXPIRED";
  }

  if (room.shareLinkMaxUses && (room.shareLinkUseCount ?? 0) >= room.shareLinkMaxUses) {
    return "LINK_MAX_USED";
  }

  return null;
}

async function incrementShareLinkUseCount(roomId: string) {
  await db
    .update(rooms)
    .set({ shareLinkUseCount: sql`${rooms.shareLinkUseCount} + 1` })
    .where(eq(rooms.id, roomId));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; code: string }>;
}): Promise<Metadata> {
  const { locale, code } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "app.join" });
  const tEnums = await getTranslations({ locale, namespace: "enums" });

  const room = await getRoomByShareLink(code);
  if (!room || validateShareLink(room)) return { title: t("title") };

  const cityName = tEnums(`city.${room.city}`);
  return { title: `${room.title} — ${cityName}` };
}

type Props = {
  params: Promise<{ locale: Locale; code: string }>;
};

export default async function JoinRoomPage({ params }: Props) {
  const { locale, code } = await params;
  if (!hasLocale(routing.locales, locale)) return null;
  setRequestLocale(locale);
  await requireSession();

  const t = await getTranslations({ locale, namespace: "app.join" });
  const tCommon = await getTranslations({ locale, namespace: "common.labels" });
  const tEnums = await getTranslations({ locale, namespace: "enums" });

  const room = await getRoomByShareLink(code);

  if (!room) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <Card className="w-full max-w-lg text-center">
          <CardHeader>
            <CardTitle>{t("title")}</CardTitle>
            <CardDescription>{t("errors.INVALID_LINK")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/discover">{tCommon("cancel")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const error = validateShareLink(room);
  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <Card className="w-full max-w-lg text-center">
          <CardHeader>
            <CardTitle>{t("title")}</CardTitle>
            <CardDescription>{t(`errors.${error}`)}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/discover">{tCommon("cancel")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Valid share link — increment use count
  await incrementShareLinkUseCount(room.id);

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
                {tCommon("housemates", { count: room.housemateCount })}
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button asChild variant="outline" className="flex-1">
              <Link href="/discover">{tCommon("cancel")}</Link>
            </Button>
            <Button asChild className="flex-1">
              <Link href={`/discover/${room.id}`}>{tCommon("apply")}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
