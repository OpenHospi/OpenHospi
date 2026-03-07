"use server";

import { withRLS } from "@openhospi/database";
import { profilePhotos } from "@openhospi/database/schema";
import type { EditProfileData } from "@openhospi/database/validators";
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { requireNotRestricted, requireSession } from "@/lib/auth/server";
import {
  deleteProfilePhotoForUser,
  saveProfilePhotoForUser,
  updateProfileForUser,
} from "@/lib/services/profile-mutations";

type Tx = Parameters<Parameters<typeof withRLS>[1]>[0];

async function syncAvatarUrl(tx: Tx, userId: string): Promise<void> {
  const { profiles } = await import("@openhospi/database/schema");
  const [slot1] = await tx
    .select({ url: profilePhotos.url })
    .from(profilePhotos)
    .where(and(eq(profilePhotos.userId, userId), eq(profilePhotos.slot, 1)));
  await tx
    .update(profiles)
    .set({ avatarUrl: slot1?.url ?? null })
    .where(eq(profiles.id, userId));
}

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

  if (!file) return { error: "uploadFailed" as const };

  const result = await saveProfilePhotoForUser(session.user.id, file, slot);
  if ("photo" in result) revalidatePath("/profile");
  return result;
}

export async function reorderProfilePhotos(swaps: { photoId: string; newSlot: number }[]) {
  const session = await requireSession();
  const restricted = await requireNotRestricted(session.user.id);
  if (restricted) return restricted;

  if (swaps.length === 0) return {};
  if (swaps.some((s) => s.newSlot < 1 || s.newSlot > 5)) return { error: "uploadFailed" as const };

  try {
    const ids = swaps.map((s) => s.photoId);

    await withRLS(session.user.id, async (tx) => {
      const existing = await tx
        .select({ id: profilePhotos.id })
        .from(profilePhotos)
        .where(and(eq(profilePhotos.userId, session.user.id), inArray(profilePhotos.id, ids)));

      if (existing.length !== swaps.length) throw new Error("Photo not found");

      for (const swap of swaps) {
        await tx
          .update(profilePhotos)
          .set({ slot: -swap.newSlot })
          .where(eq(profilePhotos.id, swap.photoId));
      }

      for (const swap of swaps) {
        await tx
          .update(profilePhotos)
          .set({ slot: swap.newSlot })
          .where(eq(profilePhotos.id, swap.photoId));
      }

      await syncAvatarUrl(tx, session.user.id);
    });

    revalidatePath("/profile");
    return {};
  } catch (e: unknown) {
    console.error(e);
    return { error: "uploadFailed" as const };
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
