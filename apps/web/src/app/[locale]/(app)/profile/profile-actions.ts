"use server";

import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth-server";
import { pool } from "@/lib/db";
import { deletePhotoFromStorage, uploadPhotoToStorage } from "@/lib/photos";
import type { ProfilePhoto } from "@/lib/profile";
import type { EditProfileData } from "@/lib/schemas/profile";
import { editProfileSchema } from "@/lib/schemas/profile";

export async function updateProfile(data: EditProfileData) {
  const session = await requireSession("nl");
  const parsed = editProfileSchema.safeParse(data);
  if (!parsed.success) return { error: "Invalid data" };

  const {
    gender,
    birth_date,
    study_program,
    study_level,
    bio,
    lifestyle_tags,
    preferred_city,
    max_rent,
    available_from,
    vereniging,
    instagram_handle,
    show_instagram,
  } = parsed.data;

  await pool.query(
    `UPDATE profiles SET
       gender = $1, birth_date = $2, study_program = $3, study_level = $4, bio = $5,
       lifestyle_tags = $6, preferred_city = $7, max_rent = $8, available_from = $9,
       vereniging = $10, instagram_handle = $11, show_instagram = $12
     WHERE id = $13`,
    [
      gender,
      birth_date,
      study_program,
      study_level || null,
      bio || null,
      lifestyle_tags,
      preferred_city,
      max_rent || null,
      available_from,
      vereniging || null,
      instagram_handle || null,
      show_instagram,
      session.user.id,
    ],
  );

  revalidatePath("/profile");
  return { success: true };
}

export async function uploadProfilePhoto(
  formData: FormData,
): Promise<{ error?: string; photo?: ProfilePhoto }> {
  const session = await requireSession("nl");
  const file = formData.get("file") as File | null;
  const slotStr = formData.get("slot") as string | null;

  if (!file || !slotStr) return { error: "Missing file or slot" };

  const slot = Number.parseInt(slotStr, 10);
  if (slot < 1 || slot > 5) return { error: "Invalid slot" };

  const ext = file.name.split(".").pop() || "jpg";
  const path = `${session.user.id}/${slot}.${ext}`;

  try {
    const url = await uploadPhotoToStorage("profile-photos", path, file);

    const { rows } = await pool.query(
      `INSERT INTO profile_photos (user_id, slot, url)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, slot) DO UPDATE SET url = EXCLUDED.url, uploaded_at = NOW()
       RETURNING id, slot, url, caption`,
      [session.user.id, slot, url],
    );

    revalidatePath("/profile");
    return { photo: rows[0] };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Upload failed";
    return { error: message };
  }
}

export async function deleteProfilePhoto(slot: number): Promise<{ error?: string }> {
  const session = await requireSession("nl");

  if (slot < 1 || slot > 5) return { error: "Invalid slot" };

  try {
    const { rows } = await pool.query(
      "SELECT url FROM profile_photos WHERE user_id = $1 AND slot = $2",
      [session.user.id, slot],
    );

    if (rows.length === 0) return { error: "Photo not found" };

    const url = rows[0].url as string;
    const bucketPath = url.split("/storage/v1/object/public/profile-photos/")[1];
    if (bucketPath) {
      await deletePhotoFromStorage("profile-photos", bucketPath);
    }

    await pool.query("DELETE FROM profile_photos WHERE user_id = $1 AND slot = $2", [
      session.user.id,
      slot,
    ]);

    revalidatePath("/profile");
    return {};
  } catch (e) {
    const message = e instanceof Error ? e.message : "Delete failed";
    return { error: message };
  }
}
