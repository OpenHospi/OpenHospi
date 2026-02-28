"use server";

import { db } from "@openhospi/database";
import { roomPhotos, rooms } from "@openhospi/database/schema";
import type { RoomPhoto } from "@openhospi/database/types";
import { and, eq } from "drizzle-orm";

import { requireSession } from "@/lib/auth-server";
import { deletePhotoFromStorage, uploadPhotoToStorage } from "@/lib/photos";

export async function saveRoomPhoto(
  formData: FormData,
): Promise<{ error?: string; photo?: RoomPhoto }> {
  const session = await requireSession();

  const file = formData.get("file") as File | null;
  const roomId = formData.get("roomId") as string | null;
  const slot = Number(formData.get("slot"));

  if (!file) return { error: "Missing file" };
  if (!roomId) return { error: "Missing roomId" };
  if (slot < 1 || slot > 10) return { error: "Invalid slot" };

  // Verify ownership
  const [room] = await db
    .select({ id: rooms.id })
    .from(rooms)
    .where(and(eq(rooms.id, roomId), eq(rooms.ownerId, session.user.id)));
  if (!room) return { error: "Room not found" };

  try {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${roomId}/slot-${slot}.${ext}`;
    const url = await uploadPhotoToStorage(file, "room-photos", path);

    const [photo] = await db
      .insert(roomPhotos)
      .values({ roomId, slot, url })
      .onConflictDoUpdate({
        target: [roomPhotos.roomId, roomPhotos.slot],
        set: { url, uploadedAt: new Date() },
      })
      .returning();

    return { photo };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Save failed";
    return { error: message };
  }
}

export async function deleteRoomPhoto(roomId: string, slot: number): Promise<{ error?: string }> {
  const session = await requireSession();

  if (slot < 1 || slot > 10) return { error: "Invalid slot" };

  // Verify ownership
  const [room] = await db
    .select({ id: rooms.id })
    .from(rooms)
    .where(and(eq(rooms.id, roomId), eq(rooms.ownerId, session.user.id)));
  if (!room) return { error: "Room not found" };

  try {
    const [photo] = await db
      .select({ url: roomPhotos.url })
      .from(roomPhotos)
      .where(and(eq(roomPhotos.roomId, roomId), eq(roomPhotos.slot, slot)));

    if (!photo) return { error: "Photo not found" };

    await deletePhotoFromStorage(photo.url);

    await db
      .delete(roomPhotos)
      .where(and(eq(roomPhotos.roomId, roomId), eq(roomPhotos.slot, slot)));

    return {};
  } catch (e) {
    const message = e instanceof Error ? e.message : "Delete failed";
    return { error: message };
  }
}
