import type { Locale } from "@openhospi/i18n";
import { RoomStatus } from "@openhospi/shared/enums";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { redirect } from "@/i18n/navigation-app";
import { routing } from "@/i18n/routing";
import { getRoomApplicants } from "@/lib/applicants";
import { requireSession } from "@/lib/auth-server";
import { getRoom } from "@/lib/rooms";
import { getCloseRoomApplicants } from "@/lib/votes";

import { EditRoomDialog } from "./edit-room-dialog";
import { RoomHeader } from "./room-header";
import { RoomTabs } from "./room-tabs";
import { StatusControls } from "./status-controls";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: Locale; id: string }>;
};

export default async function RoomManagementLayout({ children, params }: Props) {
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

  const applicantCount =
    room.status !== RoomStatus.draft ? (await getRoomApplicants(id, user.id)).length : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <RoomHeader room={room} />
        <div className="flex flex-wrap items-center gap-2">
          <StatusControls room={room} closeApplicants={closeApplicants} />
          <EditRoomDialog room={room} />
        </div>
      </div>

      <RoomTabs roomId={room.id} roomStatus={room.status} applicantCount={applicantCount} />

      {children}
    </div>
  );
}
