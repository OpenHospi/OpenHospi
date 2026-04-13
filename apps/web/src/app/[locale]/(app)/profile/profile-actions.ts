"use server";

import { CommonError } from "@openhospi/shared/error-codes";
import type { EditProfileData } from "@openhospi/validators";
import { revalidatePath } from "next/cache";

import { requireNotRestricted, requireSession } from "@/lib/auth/server";
import {
  deleteProfilePhotoForUser,
  reorderProfilePhotosBySwapsForUser,
  saveProfilePhotoForUser,
  updateProfileForUser,
} from "@/lib/services/profile-mutations";

export async function updateProfile(data: EditProfileData) {
  const session = await requireSession();
  const restricted = await requireNotRestricted(session.user.id);
  if (restricted) return restricted;

  const result = await updateProfileForUser(session.user.id, data);
  if ("success" in result) revalidatePath("/profile");
  return result;
}

export async function saveProfilePhoto(formData: FormData) {
  const session = await requireSession();
  const restricted = await requireNotRestricted(session.user.id);
  if (restricted) return restricted;

  const file = formData.get("file") as File | null;
  const slot = Number(formData.get("slot"));

  if (!file) return { error: CommonError.upload_failed };

  const result = await saveProfilePhotoForUser(session.user.id, file, slot);
  if ("photo" in result) revalidatePath("/profile");
  return result;
}

export async function reorderProfilePhotos(swaps: { photoId: string; newSlot: number }[]) {
  const session = await requireSession();
  const restricted = await requireNotRestricted(session.user.id);
  if (restricted) return restricted;

  if (swaps.length === 0) return {};
  if (swaps.some((s) => s.newSlot < 1 || s.newSlot > 5))
    return { error: CommonError.upload_failed };

  try {
    const result = await reorderProfilePhotosBySwapsForUser(session.user.id, swaps);
    if ("error" in result) return { error: result.error };

    revalidatePath("/profile");
    return {};
  } catch (e: unknown) {
    console.error(e);
    return { error: CommonError.upload_failed };
  }
}

export async function deleteProfilePhoto(slot: number) {
  const session = await requireSession();
  const restricted = await requireNotRestricted(session.user.id);
  if (restricted) return restricted;

  const result = await deleteProfilePhotoForUser(session.user.id, slot);
  if ("success" in result) revalidatePath("/profile");
  return result;
}
