"use server";

import { CommonError } from "@openhospi/shared/error-codes";
import { revalidatePath } from "next/cache";

import { requireNotRestricted, requireSession } from "@/lib/auth/server";
import {
  deleteRoomPhotoForUser,
  reorderRoomPhotosForUser,
  saveRoomPhotoForUser,
  updatePhotoCaptionForUser,
} from "@/lib/services/room-mutations";

export async function saveRoomPhoto(formData: FormData) {
  const session = await requireSession();
  const userId = session.user.id;
  const restricted = await requireNotRestricted(userId);
  if (restricted) return restricted;

  const file = formData.get("file") as File | null;
  const roomId = formData.get("roomId") as string | null;
  const slot = Number(formData.get("slot"));

  if (!file || !roomId) return { error: CommonError.upload_failed };

  const result = await saveRoomPhotoForUser(userId, file, roomId, slot);
  if ("photo" in result) revalidatePath(`/my-rooms/${roomId}`);
  return result;
}

export async function deleteRoomPhoto(roomId: string, slot: number) {
  const session = await requireSession();
  const userId = session.user.id;
  const restricted = await requireNotRestricted(userId);
  if (restricted) return restricted;

  const result = await deleteRoomPhotoForUser(userId, roomId, slot);
  if ("success" in result) revalidatePath(`/my-rooms/${roomId}`);
  return result;
}

export async function updatePhotoCaption(roomId: string, slot: number, caption: string | null) {
  const session = await requireSession();
  const userId = session.user.id;
  const restricted = await requireNotRestricted(userId);
  if (restricted) return restricted;

  const result = await updatePhotoCaptionForUser(userId, roomId, slot, caption);
  if ("success" in result) revalidatePath(`/my-rooms/${roomId}`);
  return result;
}

export async function reorderRoomPhotos(
  roomId: string,
  swaps: { photoId: string; newSlot: number }[],
) {
  const session = await requireSession();
  const userId = session.user.id;
  const restricted = await requireNotRestricted(userId);
  if (restricted) return restricted;

  const result = await reorderRoomPhotosForUser(userId, roomId, swaps);
  if ("success" in result) revalidatePath(`/my-rooms/${roomId}`);
  return result;
}
