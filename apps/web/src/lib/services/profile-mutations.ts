import { createDrizzleSupabaseClient } from "@openhospi/database";
import { profilePhotos, profiles } from "@openhospi/database/schema";
import { STORAGE_BUCKET_PROFILE_PHOTOS } from "@openhospi/shared/constants";
import { CommonError } from "@openhospi/shared/error-codes";
import type { EditProfileData } from "@openhospi/validators";
import { editProfileSchema } from "@openhospi/validators";
import { and, eq } from "drizzle-orm";

import { deletePhotoFromStorage, uploadPhotoToStorage } from "@/lib/services/photos";

type Tx = Parameters<Parameters<ReturnType<typeof createDrizzleSupabaseClient>["rls"]>[0]>[0];

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

export async function updateProfileForUser(userId: string, data: EditProfileData) {
  const parsed = editProfileSchema.safeParse(data);
  if (!parsed.success) return { error: CommonError.invalid_data };

  const d = parsed.data;
  const updates: Record<string, unknown> = {};
  if ("gender" in d) updates.gender = d.gender;
  if ("birthDate" in d) updates.birthDate = d.birthDate;
  if ("studyProgram" in d) updates.studyProgram = d.studyProgram;
  if ("studyLevel" in d) updates.studyLevel = d.studyLevel || null;
  if ("bio" in d) updates.bio = d.bio || null;
  if ("lifestyleTags" in d) updates.lifestyleTags = d.lifestyleTags;
  if ("languages" in d) updates.languages = d.languages;
  if ("preferredCity" in d) updates.preferredCity = d.preferredCity;
  if ("vereniging" in d) updates.vereniging = d.vereniging || null;

  if (Object.keys(updates).length === 0) return { success: true };

  await createDrizzleSupabaseClient(userId).rls((tx) =>
    tx.update(profiles).set(updates).where(eq(profiles.id, userId)),
  );

  return { success: true };
}

export async function saveProfilePhotoForUser(
  userId: string,
  file: File,
  slot: number,
  flagged = false,
) {
  if (!file) return { error: CommonError.upload_failed };
  if (slot < 1 || slot > 5) return { error: CommonError.upload_failed };

  let url: string | undefined;

  try {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${userId}/slot-${slot}.${ext}`;
    url = await uploadPhotoToStorage(file, STORAGE_BUCKET_PROFILE_PHOTOS, path);

    const photoUrl = url;
    const moderationStatus = flagged ? ("pending_review" as const) : ("approved" as const);
    const [photo] = await createDrizzleSupabaseClient(userId).rls(async (tx) => {
      const [inserted] = await tx
        .insert(profilePhotos)
        .values({ userId, slot, url: photoUrl, moderationStatus })
        .onConflictDoUpdate({
          target: [profilePhotos.userId, profilePhotos.slot],
          set: { url: photoUrl, moderationStatus, uploadedAt: new Date() },
        })
        .returning();
      await syncAvatarUrl(tx, userId);
      return [inserted];
    });

    return { photo };
  } catch (e: unknown) {
    if (url) await deletePhotoFromStorage(url).catch(() => {});
    console.error(e);
    return { error: CommonError.upload_failed };
  }
}

export async function deleteProfilePhotoForUser(userId: string, slot: number) {
  if (slot < 1 || slot > 5) return { error: CommonError.delete_failed };

  try {
    const [photo] = await createDrizzleSupabaseClient(userId).rls((tx) =>
      tx
        .select({ url: profilePhotos.url })
        .from(profilePhotos)
        .where(and(eq(profilePhotos.userId, userId), eq(profilePhotos.slot, slot))),
    );

    if (!photo) return { error: CommonError.delete_failed };

    await deletePhotoFromStorage(photo.url);

    await createDrizzleSupabaseClient(userId).rls(async (tx) => {
      await tx
        .delete(profilePhotos)
        .where(and(eq(profilePhotos.userId, userId), eq(profilePhotos.slot, slot)));
      await syncAvatarUrl(tx, userId);
    });

    return { success: true };
  } catch (e: unknown) {
    console.error(e);
    return { error: CommonError.delete_failed };
  }
}
