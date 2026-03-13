import { createDrizzleSupabaseClient } from "@/lib/db";
import { profilePhotos, profiles } from "@/lib/db/schema";
import type { EditProfileData } from "@openhospi/database/validators";
import { editProfileSchema } from "@openhospi/database/validators";
import { STORAGE_BUCKET_PROFILE_PHOTOS } from "@openhospi/shared/constants";
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
  if (!parsed.success) return { error: "invalidData" as const };

  const d = parsed.data;
  await createDrizzleSupabaseClient(userId).rls((tx) =>
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
        vereniging: d.vereniging || null,
      })
      .where(eq(profiles.id, userId)),
  );

  return { success: true };
}

export async function saveProfilePhotoForUser(userId: string, file: File, slot: number) {
  if (!file) return { error: "uploadFailed" as const };
  if (slot < 1 || slot > 5) return { error: "uploadFailed" as const };

  let url: string | undefined;

  try {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${userId}/slot-${slot}.${ext}`;
    url = await uploadPhotoToStorage(file, STORAGE_BUCKET_PROFILE_PHOTOS, path);

    const photoUrl = url;
    const [photo] = await createDrizzleSupabaseClient(userId).rls(async (tx) => {
      const [inserted] = await tx
        .insert(profilePhotos)
        .values({ userId, slot, url: photoUrl })
        .onConflictDoUpdate({
          target: [profilePhotos.userId, profilePhotos.slot],
          set: { url: photoUrl, uploadedAt: new Date() },
        })
        .returning();
      await syncAvatarUrl(tx, userId);
      return [inserted];
    });

    return { photo };
  } catch (e: unknown) {
    if (url) await deletePhotoFromStorage(url).catch(() => {});
    console.error(e);
    return { error: "uploadFailed" as const };
  }
}

export async function deleteProfilePhotoForUser(userId: string, slot: number) {
  if (slot < 1 || slot > 5) return { error: "deleteFailed" as const };

  try {
    const [photo] = await createDrizzleSupabaseClient(userId).rls((tx) =>
      tx
        .select({ url: profilePhotos.url })
        .from(profilePhotos)
        .where(and(eq(profilePhotos.userId, userId), eq(profilePhotos.slot, slot))),
    );

    if (!photo) return { error: "deleteFailed" as const };

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
    return { error: "deleteFailed" as const };
  }
}
