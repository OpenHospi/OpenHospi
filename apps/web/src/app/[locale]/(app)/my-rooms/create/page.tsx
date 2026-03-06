import type { Locale } from "@openhospi/i18n";
import { RoomStatus } from "@openhospi/shared/enums";
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { redirect } from "@/i18n/navigation-app";
import { routing } from "@/i18n/routing";
import { requireSession } from "@/lib/auth/server";
import { getUserOwnerHouses } from "@/lib/queries/houses";
import { getRoom } from "@/lib/queries/rooms";

import { HouseGate } from "./house-gate";
import { RoomCreateForm } from "./room-create-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "app.rooms" });
  return { title: t("createNew") };
}

type Props = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ id?: string }>;
};

export default async function RoomCreatePage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { id } = await searchParams;
  if (!hasLocale(routing.locales, locale)) return null;
  setRequestLocale(locale);
  const { user } = await requireSession();

  if (!id) {
    const houses = await getUserOwnerHouses(user.id);
    return <HouseGate houses={houses} />;
  }

  const room = await getRoom(id, user.id);
  if (!room || room.status !== RoomStatus.draft) {
    return redirect({ href: "/my-rooms", locale });
  }

  return <RoomCreateForm room={room} />;
}
