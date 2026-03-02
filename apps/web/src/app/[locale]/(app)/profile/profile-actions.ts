"use server";

import { withRLS } from "@openhospi/database";
import { profilePhotos, profiles } from "@openhospi/database/schema";
import type { EditProfileData } from "@openhospi/database/validators";
import { editProfileSchema } from "@openhospi/database/validators";
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { requireNotRestricted, requireSession } from "@/lib/auth-server";
import { deletePhotoFromStorage, uploadPhotoToStorage } from "@/lib/photos";

type Tx = Parameters<Parameters<typeof withRLS>[1]>[0];

async function syncAvatarUrl(tx: Tx, userId: string): Promise<void> {
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

  const parsed = editProfileSchema.safeParse(data);
  if (!parsed.success) return { error: "invalidData" as const };

  const d = parsed.data;
  await withRLS(session.user.id, (tx) =>
    tx
      .update(profiles)
      .set({
        gender: d.gender,
        birthDate: d.birthDate,
        studyProgram: d.studyProgram,
        studyLevel: d.studyLevel || null,
        bio: d.bio || null,
        lifestyleTags: d.lifestyleTags,
        languages: d.languages,
        preferredCity: d.preferredCity,
        maxRent: d.maxRent != null ? String(d.maxRent) : null,
        availableFrom: d.availableFrom,
        vereniging: d.vereniging || null,
      })
      .where(eq(profiles.id, session.user.id)),
  );

  revalidatePath("/profile");
  return { success: true };
}

export async function saveProfilePhoto(formData: FormData) {
  const session = await requireSession();
  const restricted = await requireNotRestricted(session.user.id);
  if (restricted) return restricted;

  const file = formData.get("file") as File | null;
  const slot = Number(formData.get("slot"));

  if (!file) return { error: "uploadFailed" as const };
  if (slot < 1 || slot > 5) return { error: "uploadFailed" as const };

  let url: string | undefined;

  try {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${session.user.id}/slot-${slot}.${ext}`;
    url = await uploadPhotoToStorage(file, "profile-photos", path);

    const photoUrl = url;
    const [photo] = await withRLS(session.user.id, async (tx) => {
      const [inserted] = await tx
        .insert(profilePhotos)
        .values({ userId: session.user.id, slot, url: photoUrl })
        .onConflictDoUpdate({
          target: [profilePhotos.userId, profilePhotos.slot],
          set: { url: photoUrl, uploadedAt: new Date() },
        })
        .returning();
      await syncAvatarUrl(tx, session.user.id);
      return [inserted];
    });

    revalidatePath("/profile");
    return { photo };
  } catch (e) {
    if (url) await deletePhotoFromStorage(url).catch(() => {});
    console.error(e);
    return { error: "uploadFailed" as const };
  }
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
      // Verify all photos belong to the user
      const existing = await tx
        .select({ id: profilePhotos.id })
        .from(profilePhotos)
        .where(and(eq(profilePhotos.userId, session.user.id), inArray(profilePhotos.id, ids)));

      if (existing.length !== swaps.length) throw new Error("Photo not found");

      // Phase 1: set to negative temp values to avoid unique constraint
      for (const swap of swaps) {
        await tx
          .update(profilePhotos)
          .set({ slot: -swap.newSlot })
          .where(eq(profilePhotos.id, swap.photoId));
      }

      // Phase 2: set to final positive values
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
  } catch (e) {
    console.error(e);
    return { error: "uploadFailed" as const };
  }
}

export async function deleteProfilePhoto(slot: number) {
  const session = await requireSession();
  const restricted = await requireNotRestricted(session.user.id);
  if (restricted) return restricted;

  if (slot < 1 || slot > 5) return { error: "deleteFailed" as const };

  try {
    const [photo] = await withRLS(session.user.id, (tx) =>
      tx
        .select({ url: profilePhotos.url })
        .from(profilePhotos)
        .where(and(eq(profilePhotos.userId, session.user.id), eq(profilePhotos.slot, slot))),
    );

    if (!photo) return { error: "deleteFailed" as const };

    await deletePhotoFromStorage(photo.url);

    await withRLS(session.user.id, async (tx) => {
      await tx
        .delete(profilePhotos)
        .where(and(eq(profilePhotos.userId, session.user.id), eq(profilePhotos.slot, slot)));
      await syncAvatarUrl(tx, session.user.id);
    });

    revalidatePath("/profile");
    return {};
  } catch (e) {
    console.error(e);
    return { error: "deleteFailed" as const };
  }
}
