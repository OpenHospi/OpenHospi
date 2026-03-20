"use server";

import type { Locale } from "@openhospi/i18n";
import type { EditRoomData, ShareLinkSettingsData } from "@openhospi/validators";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";

import { redirect } from "@/i18n/navigation-app";
import { requireNotRestricted, requireSession } from "@/lib/auth/server";
import {
  deleteRoomForUser,
  regenerateShareLinkForUser,
  updateRoomForUser,
  updateRoomStatusForUser,
  updateShareLinkSettingsForUser,
} from "@/lib/services/room-mutations";

export async function updateRoom(roomId: string, data: EditRoomData) {
  const session = await requireSession();
  const restricted = await requireNotRestricted(session.user.id);
  if (restricted) return restricted;

  const result = await updateRoomForUser(session.user.id, roomId, data);
  if ("success" in result) revalidatePath(`/my-rooms/${roomId}`);
  return result;
}

export async function updateRoomStatus(roomId: string, status: string) {
  const session = await requireSession();
  const restricted = await requireNotRestricted(session.user.id);
  if (restricted) return restricted;

  const result = await updateRoomStatusForUser(session.user.id, roomId, status);
  if ("success" in result) {
    revalidatePath(`/my-rooms/${roomId}`);
    revalidatePath("/my-rooms");
  }
  return result;
}

export async function regenerateShareLink(roomId: string) {
  const session = await requireSession();
  const restricted = await requireNotRestricted(session.user.id);
  if (restricted) return restricted;

  const result = await regenerateShareLinkForUser(session.user.id, roomId);
  if ("success" in result) revalidatePath(`/my-rooms/${roomId}`);
  return result;
}

export async function updateShareLinkSettings(roomId: string, data: ShareLinkSettingsData) {
  const session = await requireSession();
  const restricted = await requireNotRestricted(session.user.id);
  if (restricted) return restricted;

  const result = await updateShareLinkSettingsForUser(session.user.id, roomId, data);
  if ("success" in result) revalidatePath(`/my-rooms/${roomId}`);
  return result;
}

export async function deleteRoom(roomId: string) {
  const session = await requireSession();

  await deleteRoomForUser(session.user.id, roomId);

  revalidatePath("/my-rooms");
  const locale = (await getLocale()) as Locale;
  redirect({ href: "/my-rooms", locale });
}
