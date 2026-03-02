import type { Locale } from "@openhospi/i18n";
import { ApplicationStatus } from "@openhospi/shared/enums";
import { ArrowLeft, Settings } from "lucide-react";
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ReportDialog } from "@/components/app/report-dialog";
import { RoomDetailContent } from "@/components/app/room-detail-content";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation-app";
import { routing } from "@/i18n/routing";
import { getApplicationForRoom, getRoomDetailForApply } from "@/lib/applications";
import { requireSession } from "@/lib/auth-server";
import { getRoomMetadata } from "@/lib/discover";
import { applyRoomToDetail } from "@/lib/room-detail";
import { APPLICATION_STATUS_COLORS } from "@/lib/status-colors";
import { getStoragePublicUrl } from "@/lib/storage-url";

import { ApplyDialog } from "./apply-dialog";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "app.roomDetail" });
  const tEnums = await getTranslations({ locale, namespace: "enums" });

  const room = await getRoomMetadata(id);
  if (!room) return { title: t("notFound") };

  const cityName = tEnums(`city.${room.city}`);
  const sizeSuffix = room.roomSizeM2 ? ` · ${room.roomSizeM2} m²` : "";
  const title = `${room.title} — ${cityName}`;
  const description = `€${room.totalCost}/mo · ${cityName}${sizeSuffix}`;
  const ogImage = room.coverPhotoPath
    ? getStoragePublicUrl(room.coverPhotoPath, "room-photos")
    : undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      ...(ogImage && { images: [{ url: ogImage }] }),
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title,
      description,
      ...(ogImage && { images: [ogImage] }),
    },
  };
}

type Props = {
  params: Promise<{ locale: Locale; id: string }>;
};

export default async function DiscoverRoomDetailPage({ params }: Props) {
  const { locale, id } = await params;
  if (!hasLocale(routing.locales, locale)) return null;
  setRequestLocale(locale);
  const { user } = await requireSession();

  const t = await getTranslations({ locale, namespace: "app.roomDetail" });
  const tEnums = await getTranslations({ locale, namespace: "enums" });

  const [room, existingApplication] = await Promise.all([
    getRoomDetailForApply(id, user.id),
    getApplicationForRoom(id, user.id),
  ]);

  if (!room) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <p className="text-muted-foreground">{t("notAvailable")}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/discover">{t("backToDiscover")}</Link>
        </Button>
      </div>
    );
  }

  const isOwner = room.ownerId === user.id;
  const isInvitee =
    isOwner ||
    (existingApplication != null &&
      (
        [
          ApplicationStatus.invited,
          ApplicationStatus.attending,
          ApplicationStatus.accepted,
        ] as string[]
      ).includes(existingApplication.status));

  return (
    <>
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/discover">
            <ArrowLeft className="size-4" />
            {t("backToDiscover")}
          </Link>
        </Button>
      </div>
      <RoomDetailContent
        room={applyRoomToDetail(room)}
      context={{
        isAuthenticated: true,
        isOwner,
        isInvitee,
        existingApplication,
        loginUrl: null,
      }}
      sidebarActions={
        <>
          {isOwner && (
            <Button asChild variant="outline" className="w-full">
              <Link href={`/my-rooms/${room.id}`}>
                <Settings className="size-4" />
                {t("manageRoom")}
              </Link>
            </Button>
          )}
          {!isOwner && existingApplication && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge className={APPLICATION_STATUS_COLORS[existingApplication.status]}>
                  {tEnums(`application_status.${existingApplication.status}`)}
                </Badge>
              </div>
              <Button asChild variant="outline" className="w-full">
                <Link href={`/applications/${existingApplication.id}`}>{t("viewApplication")}</Link>
              </Button>
            </div>
          )}
          {!isOwner && !existingApplication && <ApplyDialog roomId={room.id} />}
          {!isOwner && (
            <div className="pt-2">
              <ReportDialog type="room" targetId={room.id} />
            </div>
          )}
        </>
      }
    />
    </>
  );
}
