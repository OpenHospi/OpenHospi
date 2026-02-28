"use server";

import { withRLS } from "@openhospi/database";
import { profilePhotos, profiles } from "@openhospi/database/schema";
import type { ProfilePhoto } from "@openhospi/database/types";
import type { EditProfileData } from "@openhospi/database/validators";
import { editProfileSchema } from "@openhospi/database/validators";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth-server";
import { deletePhotoFromStorage, uploadPhotoToStorage } from "@/lib/photos";

export async function updateProfile(data: EditProfileData) {
  const session = await requireSession();
  const parsed = editProfileSchema.safeParse(data);
  if (!parsed.success) return { error: "Invalid data" };

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
        preferredCity: d.preferredCity,
        maxRent: d.maxRent != null ? String(d.maxRent) : null,
        availableFrom: d.availableFrom,
        vereniging: d.vereniging || null,
        instagramHandle: d.instagramHandle || null,
        showInstagram: d.showInstagram,
      })
      .where(eq(profiles.id, session.user.id)),
  );

  revalidatePath("/profile");
  return { success: true };
}

export async function saveProfilePhoto(
  formData: FormData,
): Promise<{ error?: string; photo?: ProfilePhoto }> {
  const session = await requireSession();

  const file = formData.get("file") as File | null;
  const slot = Number(formData.get("slot"));

  if (!file) return { error: "Missing file" };
  if (slot < 1 || slot > 5) return { error: "Invalid slot" };

  let url: string | undefined;

  try {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${session.user.id}/slot-${slot}.${ext}`;
    url = await uploadPhotoToStorage(file, "profile-photos", path);

    const [photo] = await withRLS(session.user.id, (tx) =>
      tx
        .insert(profilePhotos)
        .values({ userId: session.user.id, slot, url })
        .onConflictDoUpdate({
          target: [profilePhotos.userId, profilePhotos.slot],
          set: { url, uploadedAt: new Date() },
        })
        .returning(),
    );

    revalidatePath("/profile");
    return { photo };
  } catch (e) {
    if (url) await deletePhotoFromStorage(url).catch(() => {});
    const message = e instanceof Error ? e.message : "Save failed";
    return { error: message };
  }
}

export async function deleteProfilePhoto(slot: number): Promise<{ error?: string }> {
  const session = await requireSession();

  if (slot < 1 || slot > 5) return { error: "Invalid slot" };

  try {
    const [photo] = await withRLS(session.user.id, (tx) =>
      tx
        .select({ url: profilePhotos.url })
        .from(profilePhotos)
        .where(and(eq(profilePhotos.userId, session.user.id), eq(profilePhotos.slot, slot))),
    );

    if (!photo) return { error: "Photo not found" };

    await deletePhotoFromStorage(photo.url);

    await withRLS(session.user.id, (tx) =>
      tx
        .delete(profilePhotos)
        .where(and(eq(profilePhotos.userId, session.user.id), eq(profilePhotos.slot, slot))),
    );

    revalidatePath("/profile");
    return {};
  } catch (e) {
    const message = e instanceof Error ? e.message : "Delete failed";
    return { error: message };
  }
}
