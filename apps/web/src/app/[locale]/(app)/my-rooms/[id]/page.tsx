import type { Locale } from "@openhospi/i18n";
import { RoomStatus } from "@openhospi/shared/enums";
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Main } from "@/components/layout/main";
import { redirect } from "@/i18n/navigation-app";
import { routing } from "@/i18n/routing";
import { requireSession } from "@/lib/auth/server";
import { getRoom } from "@/lib/queries/rooms";

import { RoomDetails } from "./room-details";
import { RoomPhotosGrid } from "./room-photos-grid";
import { ShareLinkSection } from "./share-link-section";

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

export default async function RoomOverviewPage({ params }: Props) {
  const { locale, id } = await params;
  if (!hasLocale(routing.locales, locale)) return null;
  setRequestLocale(locale);
  const { user } = await requireSession();

  const room = await getRoom(id, user.id);
  if (!room) {
    return redirect({ href: "/my-rooms", locale });
  }

  return (
    <Main className="space-y-8">
      <RoomPhotosGrid roomId={room.id} photos={room.photos} />
      <RoomDetails room={room} />
      {room.status !== RoomStatus.draft && <ShareLinkSection room={room} />}
    </Main>
  );
}
