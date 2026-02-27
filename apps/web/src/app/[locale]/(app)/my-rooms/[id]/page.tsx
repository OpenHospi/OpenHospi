import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { RoomStatus } from "@openhospi/shared/enums";

import { requireSession } from "@/lib/auth-server";
import { getRoom } from "@/lib/rooms";

import { ApplicantsSection } from "./applicants-section";
import { EditRoomDialog } from "./edit-room-dialog";
import { EventsSection } from "./events-section";
import { RoomDetails } from "./room-details";
import { RoomHeader } from "./room-header";
import { RoomPhotosGrid } from "./room-photos-grid";
import { ShareLinkSection } from "./share-link-section";
import { StatusControls } from "./status-controls";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "app.rooms" });
  return { title: t("manage.title") };
}

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function RoomDetailPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const { user } = await requireSession();

  const room = await getRoom(id, user.id);
  if (!room) {
    return redirect("/my-rooms");
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <RoomHeader room={room} />
        <EditRoomDialog room={room} />
      </div>

      <RoomPhotosGrid roomId={room.id} photos={room.photos} />

      <RoomDetails room={room} />

      <StatusControls room={room} />

      {room.status !== RoomStatus.draft && (
        <ApplicantsSection roomId={room.id} userId={user.id} />
      )}

      {room.status !== RoomStatus.draft && (
        <EventsSection roomId={room.id} userId={user.id} />
      )}

      {room.status !== RoomStatus.draft && <ShareLinkSection room={room} />}
    </div>
  );
}
