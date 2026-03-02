import type { Locale } from "@openhospi/i18n";
import { RoomStatus } from "@openhospi/shared/enums";
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { redirect } from "@/i18n/navigation-app";
import { routing } from "@/i18n/routing";
import { requireSession } from "@/lib/auth-server";
import { getRoom } from "@/lib/rooms";
import { getCloseRoomApplicants } from "@/lib/votes";

import { ApplicantsSection } from "./applicants-section";
import { EditRoomDialog } from "./edit-room-dialog";
import { EventsSection } from "./events-section";
import { RoomDetails } from "./room-details";
import { RoomHeader } from "./room-header";
import { RoomPhotosGrid } from "./room-photos-grid";
import { ShareLinkSection } from "./share-link-section";
import { StatusControls } from "./status-controls";
import { VotingSection } from "./voting-section";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; id: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "app.rooms" });
  return { title: t("manage.title") };
}

type Props = {
  params: Promise<{ locale: Locale; id: string }>;
};

export default async function RoomDetailPage({ params }: Props) {
  const { locale, id } = await params;
  if (!hasLocale(routing.locales, locale)) return null;
  setRequestLocale(locale);
  const { user } = await requireSession();

  const room = await getRoom(id, user.id);
  if (!room) {
    return redirect({ href: "/my-rooms", locale });
  }

  const closeApplicants =
    room.status !== RoomStatus.draft && room.status !== RoomStatus.closed
      ? await getCloseRoomApplicants(id, user.id)
      : [];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <RoomHeader room={room} />
        <div className="flex flex-wrap items-center gap-2">
          <StatusControls room={room} closeApplicants={closeApplicants} />
          <EditRoomDialog room={room} />
        </div>
      </div>

      <RoomPhotosGrid roomId={room.id} photos={room.photos} />

      <RoomDetails room={room} />

      {room.status !== RoomStatus.draft && <ApplicantsSection roomId={room.id} userId={user.id} />}

      {room.status !== RoomStatus.draft && <EventsSection roomId={room.id} userId={user.id} />}

      {room.status !== RoomStatus.draft && <VotingSection roomId={room.id} />}

      {room.status !== RoomStatus.draft && <ShareLinkSection room={room} />}
    </div>
  );
}
