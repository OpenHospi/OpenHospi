import type { Locale } from "@openhospi/i18n";
import { RoomStatus } from "@openhospi/shared/enums";
import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { redirect } from "@/i18n/navigation-app";
import { routing } from "@/i18n/routing";
import { requireSession } from "@/lib/auth-server";
import { getUserOwnerHouses } from "@/lib/houses";
import { createDraftRoom, getExistingDraft, getRoom } from "@/lib/rooms";

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

    if (houses.length === 0) {
      return <HouseGate houses={[]} />;
    }

    if (houses.length === 1) {
      const existingDraftId = await getExistingDraft(user.id, houses[0].id);
      const roomId = existingDraftId ?? (await createDraftRoom(user.id, houses[0].id));
      return redirect({
        href: `/my-rooms/create?id=${roomId}` as Parameters<typeof redirect>[0]["href"],
        locale,
      });
    }

    // Multiple houses — show picker
    return <HouseGate houses={houses} />;
  }

  const room = await getRoom(id, user.id);
  if (!room || room.status !== RoomStatus.draft) {
    return redirect({ href: "/my-rooms", locale });
  }

  return <RoomCreateForm room={room} />;
}
