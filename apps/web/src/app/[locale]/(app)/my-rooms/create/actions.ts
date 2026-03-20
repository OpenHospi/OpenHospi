"use server";

import type {
  RoomBasicInfoData,
  RoomDetailsData,
  RoomPreferencesData,
} from "@openhospi/validators";
import { revalidatePath } from "next/cache";

import { requireNotRestricted, requireSession } from "@/lib/auth/server";
import {
  createDraftForHouse,
  createHouseAndDraft,
  publishRoomForUser,
  saveRoomBasicInfo,
  saveRoomDetails,
  saveRoomPreferences,
} from "@/lib/services/room-mutations";

export async function createHouseAndContinue(formData: FormData) {
  const session = await requireSession();
  const restricted = await requireNotRestricted(session.user.id);
  if (restricted) return restricted;

  const name = formData.get("name") as string;
  const result = await createHouseAndDraft(session.user.id, name);
  if ("id" in result) revalidatePath("/my-house");
  return result;
}

export async function createDraftRoomForHouse(houseId: string) {
  const session = await requireSession();
  const restricted = await requireNotRestricted(session.user.id);
  if (restricted) return restricted;

  return createDraftForHouse(session.user.id, houseId);
}

export async function saveBasicInfo(roomId: string, data: RoomBasicInfoData) {
  const session = await requireSession();
  const restricted = await requireNotRestricted(session.user.id);
  if (restricted) return restricted;

  return saveRoomBasicInfo(session.user.id, roomId, data);
}

export async function saveDetails(roomId: string, data: RoomDetailsData) {
  const session = await requireSession();
  const restricted = await requireNotRestricted(session.user.id);
  if (restricted) return restricted;

  return saveRoomDetails(session.user.id, roomId, data);
}

export async function savePreferences(roomId: string, data: RoomPreferencesData) {
  const session = await requireSession();
  const restricted = await requireNotRestricted(session.user.id);
  if (restricted) return restricted;

  return saveRoomPreferences(session.user.id, roomId, data);
}

export async function publishRoom(roomId: string) {
  const session = await requireSession();
  const restricted = await requireNotRestricted(session.user.id);
  if (restricted) return restricted;

  const result = await publishRoomForUser(session.user.id, roomId);
  if ("success" in result) revalidatePath("/my-rooms");
  return result;
}
