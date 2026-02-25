"use server";

import { db } from "@openhospi/database";
import { profilePhotos, profiles } from "@openhospi/database/schema";
import type { ProfilePhoto } from "@openhospi/database/types";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth-server";
import { deletePhotoFromStorage } from "@/lib/photos";
import type { EditProfileData } from "@openhospi/database/validators";
import { editProfileSchema } from "@openhospi/database/validators";

export async function updateProfile(data: EditProfileData) {
  const session = await requireSession("nl");
  const parsed = editProfileSchema.safeParse(data);
  if (!parsed.success) return { error: "Invalid data" };

  const d = parsed.data;
  await db
    .update(profiles)
    .set({
      gender: d.gender,
      birthDate: d.birthDate,
      studyProgram: d.studyProgram,
      studyLevel: d.studyLevel || null,
      bio: d.bio || null,
      lifestyleTags: d.lifestyleTags,
      preferredCity: d.preferredCity,
      maxRent: d.maxRent != null ? String(d.maxRent) : null,
      availableFrom: d.availableFrom,
      vereniging: d.vereniging || null,
      instagramHandle: d.instagramHandle || null,
      showInstagram: d.showInstagram,
    })
    .where(eq(profiles.id, session.user.id));

  revalidatePath("/profile");
  return { success: true };
}

export async function saveProfilePhoto(
  url: string,
  slot: number,
): Promise<{ error?: string; photo?: ProfilePhoto }> {
  const session = await requireSession("nl");

  if (slot < 1 || slot > 5) return { error: "Invalid slot" };
  if (!url) return { error: "Missing URL" };

  try {
    const [photo] = await db
      .insert(profilePhotos)
      .values({ userId: session.user.id, slot, url })
      .onConflictDoUpdate({
        target: [profilePhotos.userId, profilePhotos.slot],
        set: { url, uploadedAt: new Date() },
      })
      .returning();

    revalidatePath("/profile");
    return { photo };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Save failed";
    return { error: message };
  }
}

export async function deleteProfilePhoto(slot: number): Promise<{ error?: string }> {
  const session = await requireSession("nl");

  if (slot < 1 || slot > 5) return { error: "Invalid slot" };

  try {
    const [photo] = await db
      .select({ url: profilePhotos.url })
      .from(profilePhotos)
      .where(and(eq(profilePhotos.userId, session.user.id), eq(profilePhotos.slot, slot)));

    if (!photo) return { error: "Photo not found" };

    await deletePhotoFromStorage(photo.url);

    await db
      .delete(profilePhotos)
      .where(and(eq(profilePhotos.userId, session.user.id), eq(profilePhotos.slot, slot)));

    revalidatePath("/profile");
    return {};
  } catch (e) {
    const message = e instanceof Error ? e.message : "Delete failed";
    return { error: message };
  }
}
