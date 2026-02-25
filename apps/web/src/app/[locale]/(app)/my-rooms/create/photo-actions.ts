"use server";

import { MAX_ROOM_PHOTO_SIZE } from "@openhospi/shared/constants";

import { requireSession } from "@/lib/auth-server";
import { pool } from "@/lib/db";
import { deletePhotoFromStorage, uploadPhotoToStorage } from "@/lib/photos";
import type { RoomPhoto } from "@/lib/rooms";

export async function uploadRoomPhoto(
  formData: FormData,
): Promise<{ error?: string; photo?: RoomPhoto }> {
  const session = await requireSession("nl");
  const file = formData.get("file") as File | null;
  const slotStr = formData.get("slot") as string | null;
  const roomId = formData.get("roomId") as string | null;

  if (!file || !slotStr || !roomId) return { error: "Missing file, slot, or roomId" };

  const slot = Number.parseInt(slotStr, 10);
  if (slot < 1 || slot > 10) return { error: "Invalid slot" };

  // Verify ownership
  const { rows: ownerRows } = await pool.query(
    "SELECT id FROM rooms WHERE id = $1 AND created_by = $2",
    [roomId, session.user.id],
  );
  if (ownerRows.length === 0) return { error: "Room not found" };

  const ext = file.name.split(".").pop() || "jpg";
  const path = `${roomId}/${slot}.${ext}`;

  try {
    const url = await uploadPhotoToStorage("room-photos", path, file, MAX_ROOM_PHOTO_SIZE);

    const { rows } = await pool.query(
      `INSERT INTO room_photos (room_id, slot, url)
       VALUES ($1, $2, $3)
       ON CONFLICT (room_id, slot) DO UPDATE SET url = EXCLUDED.url, uploaded_at = NOW()
       RETURNING id, slot, url, caption`,
      [roomId, slot, url],
    );

    return { photo: rows[0] };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Upload failed";
    return { error: message };
  }
}

export async function deleteRoomPhoto(roomId: string, slot: number): Promise<{ error?: string }> {
  const session = await requireSession("nl");

  if (slot < 1 || slot > 10) return { error: "Invalid slot" };

  // Verify ownership
  const { rows: ownerRows } = await pool.query(
    "SELECT id FROM rooms WHERE id = $1 AND created_by = $2",
    [roomId, session.user.id],
  );
  if (ownerRows.length === 0) return { error: "Room not found" };

  try {
    const { rows } = await pool.query(
      "SELECT url FROM room_photos WHERE room_id = $1 AND slot = $2",
      [roomId, slot],
    );

    if (rows.length === 0) return { error: "Photo not found" };

    const url = rows[0].url as string;
    const bucketPath = url.split("/storage/v1/object/public/room-photos/")[1];
    if (bucketPath) {
      await deletePhotoFromStorage("room-photos", bucketPath);
    }

    await pool.query("DELETE FROM room_photos WHERE room_id = $1 AND slot = $2", [roomId, slot]);

    return {};
  } catch (e) {
    const message = e instanceof Error ? e.message : "Delete failed";
    return { error: message };
  }
}
