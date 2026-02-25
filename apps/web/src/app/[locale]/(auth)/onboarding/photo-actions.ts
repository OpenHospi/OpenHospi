"use server";

import { requireSession } from "@/lib/auth-server";
import { pool } from "@/lib/db";
import { deletePhotoFromStorage, uploadPhotoToStorage } from "@/lib/photos";
import type { ProfilePhoto } from "@/lib/profile";

export async function uploadPhoto(
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

    return { photo: rows[0] };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Upload failed";
    return { error: message };
  }
}

export async function deletePhoto(slot: number): Promise<{ error?: string }> {
  const session = await requireSession("nl");

  if (slot < 1 || slot > 5) return { error: "Invalid slot" };

  try {
    // Find the photo to get URL for storage path
    const { rows } = await pool.query(
      "SELECT url FROM profile_photos WHERE user_id = $1 AND slot = $2",
      [session.user.id, slot],
    );

    if (rows.length === 0) return { error: "Photo not found" };

    // Extract path from URL and delete from storage
    const url = rows[0].url as string;
    const bucketPath = url.split("/storage/v1/object/public/profile-photos/")[1];
    if (bucketPath) {
      await deletePhotoFromStorage("profile-photos", bucketPath);
    }

    // Delete from database
    await pool.query("DELETE FROM profile_photos WHERE user_id = $1 AND slot = $2", [
      session.user.id,
      slot,
    ]);

    return {};
  } catch (e) {
    const message = e instanceof Error ? e.message : "Delete failed";
    return { error: message };
  }
}
