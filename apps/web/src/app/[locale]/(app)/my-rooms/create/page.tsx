import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { redirect } from "@/i18n/navigation";
import { requireSession } from "@/lib/auth-server";
import { getRoom } from "@/lib/rooms";

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
  const { user } = await requireSession(locale);

  if (!id) {
    const { createDraftRoomAction } = await import("./actions");
    const result = await createDraftRoomAction();
    if (result.error || !result.id) {
      return <p>{result.error || "Failed to create draft"}</p>;
    }
    return redirect({ href: `/my-rooms/create?id=${result.id}`, locale });
  }

  const room = await getRoom(id, user.id);
  if (!room || room.status !== "draft") {
    return redirect({ href: "/my-rooms", locale });
  }

  return <RoomCreateForm room={room} />;
}
