import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { RoomStatus } from "@openhospi/shared/enums";

import { requireSession } from "@/lib/auth-server";
import { getUserOwnerHouses } from "@/lib/houses";
import { createDraftRoom, getRoom } from "@/lib/rooms";

import { HouseGate } from "./house-gate";
import { RoomCreateForm } from "./room-create-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "app.rooms" });
  return { title: t("createNew") };
}

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ id?: string }>;
};

export default async function RoomCreatePage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { id } = await searchParams;
  setRequestLocale(locale);
  const { user } = await requireSession();

  if (!id) {
    const houses = await getUserOwnerHouses(user.id);

    if (houses.length === 0) {
      return <HouseGate houses={[]} />;
    }

    if (houses.length === 1) {
      const roomId = await createDraftRoom(user.id, houses[0].id);
      return redirect(`/my-rooms/create?id=${roomId}`);
    }

    // Multiple houses — show picker
    return <HouseGate houses={houses} />;
  }

  const room = await getRoom(id, user.id);
  if (!room || room.status !== RoomStatus.draft) {
    return redirect("/my-rooms");
  }

  return <RoomCreateForm room={room} />;
}
