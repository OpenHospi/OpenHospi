"use server";

import { withRLS } from "@openhospi/database";
import { roomPhotos } from "@openhospi/database/schema";
import type { RoomPhoto } from "@openhospi/database/types";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { requireRoomOwnership, requireSession } from "@/lib/auth-server";
import { deletePhotoFromStorage, uploadPhotoToStorage } from "@/lib/photos";

export async function saveRoomPhoto(
  formData: FormData,
): Promise<{ error?: string; photo?: RoomPhoto }> {
  const session = await requireSession();
  const userId = session.user.id;

  const file = formData.get("file") as File | null;
  const roomId = formData.get("roomId") as string | null;
  const slot = Number(formData.get("slot"));

  if (!file) return { error: "Missing file" };
  if (!roomId) return { error: "Missing roomId" };
  if (slot < 1 || slot > 10) return { error: "Invalid slot" };

  await requireRoomOwnership(roomId, userId);

  let url: string | undefined;

  try {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${roomId}/slot-${slot}.${ext}`;
    url = await uploadPhotoToStorage(file, "room-photos", path);

    const [photo] = await withRLS(userId, (tx) =>
      tx
        .insert(roomPhotos)
        .values({ roomId, slot, url })
        .onConflictDoUpdate({
          target: [roomPhotos.roomId, roomPhotos.slot],
          set: { url, uploadedAt: new Date() },
        })
        .returning(),
    );

    revalidatePath(`/my-rooms/${roomId}`);
    return { photo };
  } catch (e) {
    if (url) await deletePhotoFromStorage(url).catch(() => {});
    const message = e instanceof Error ? e.message : "Save failed";
    return { error: message };
  }
}

export async function deleteRoomPhoto(roomId: string, slot: number): Promise<{ error?: string }> {
  const session = await requireSession();
  const userId = session.user.id;

  if (slot < 1 || slot > 10) return { error: "Invalid slot" };

  await requireRoomOwnership(roomId, userId);

  try {
    const [photo] = await withRLS(userId, (tx) =>
      tx
        .select({ url: roomPhotos.url })
        .from(roomPhotos)
        .where(and(eq(roomPhotos.roomId, roomId), eq(roomPhotos.slot, slot))),
    );

    if (!photo) return { error: "Photo not found" };

    await deletePhotoFromStorage(photo.url);

    await withRLS(userId, (tx) =>
      tx
        .delete(roomPhotos)
        .where(and(eq(roomPhotos.roomId, roomId), eq(roomPhotos.slot, slot))),
    );

    revalidatePath(`/my-rooms/${roomId}`);
    return {};
  } catch (e) {
    const message = e instanceof Error ? e.message : "Delete failed";
    return { error: message };
  }
}
