"use server";

import { STORAGE_BUCKET_ROOM_PHOTOS } from "@openhospi/shared/constants";
import { roomPhotoCaptionSchema } from "@openhospi/validators";
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { requireNotRestricted, requireRoomOwnership, requireSession } from "@/lib/auth/server";
import { createDrizzleSupabaseClient } from "@/lib/db";
import { roomPhotos } from "@/lib/db/schema";
import { deletePhotoFromStorage, uploadPhotoToStorage } from "@/lib/services/photos";

export async function saveRoomPhoto(formData: FormData) {
  const session = await requireSession();
  const userId = session.user.id;
  const restricted = await requireNotRestricted(userId);
  if (restricted) return restricted;

  const file = formData.get("file") as File | null;
  const roomId = formData.get("roomId") as string | null;
  const slot = Number(formData.get("slot"));

  if (!file) return { error: "uploadFailed" as const };
  if (!roomId) return { error: "uploadFailed" as const };
  if (slot < 1 || slot > 10) return { error: "uploadFailed" as const };

  await requireRoomOwnership(roomId, userId);

  let url: string | undefined;

  try {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${roomId}/slot-${slot}.${ext}`;
    url = await uploadPhotoToStorage(file, STORAGE_BUCKET_ROOM_PHOTOS, path);

    const photoUrl = url;
    const [photo] = await createDrizzleSupabaseClient(userId).rls((tx) =>
      tx
        .insert(roomPhotos)
        .values({ roomId, slot, url: photoUrl })
        .onConflictDoUpdate({
          target: [roomPhotos.roomId, roomPhotos.slot],
          set: { url: photoUrl, uploadedAt: new Date() },
        })
        .returning(),
    );

    revalidatePath(`/my-rooms/${roomId}`);
    return { photo };
  } catch (e: unknown) {
    if (url) await deletePhotoFromStorage(url).catch(() => {});
    console.error(e);
    return { error: "uploadFailed" as const };
  }
}

export async function deleteRoomPhoto(roomId: string, slot: number) {
  const session = await requireSession();
  const userId = session.user.id;
  const restricted = await requireNotRestricted(userId);
  if (restricted) return restricted;

  if (slot < 1 || slot > 10) return { error: "deleteFailed" as const };

  await requireRoomOwnership(roomId, userId);

  try {
    const [photo] = await createDrizzleSupabaseClient(userId).rls((tx) =>
      tx
        .select({ url: roomPhotos.url })
        .from(roomPhotos)
        .where(and(eq(roomPhotos.roomId, roomId), eq(roomPhotos.slot, slot))),
    );

    if (!photo) return { error: "deleteFailed" as const };

    await deletePhotoFromStorage(photo.url);

    await createDrizzleSupabaseClient(userId).rls((tx) =>
      tx.delete(roomPhotos).where(and(eq(roomPhotos.roomId, roomId), eq(roomPhotos.slot, slot))),
    );

    revalidatePath(`/my-rooms/${roomId}`);
    return {};
  } catch (e: unknown) {
    console.error(e);
    return { error: "deleteFailed" as const };
  }
}

export async function updatePhotoCaption(roomId: string, slot: number, caption: string | null) {
  const session = await requireSession();
  const userId = session.user.id;
  const restricted = await requireNotRestricted(userId);
  if (restricted) return restricted;

  if (slot < 1 || slot > 10) return { error: "invalidData" as const };

  if (caption !== null) {
    const parsed = roomPhotoCaptionSchema.safeParse({ caption });
    if (!parsed.success) return { error: "invalidData" as const };
  }

  await requireRoomOwnership(roomId, userId);

  try {
    await createDrizzleSupabaseClient(userId).rls((tx) =>
      tx
        .update(roomPhotos)
        .set({ caption })
        .where(and(eq(roomPhotos.roomId, roomId), eq(roomPhotos.slot, slot))),
    );

    revalidatePath(`/my-rooms/${roomId}`);
    return {};
  } catch (e: unknown) {
    console.error(e);
    return { error: "uploadFailed" as const };
  }
}

export async function reorderRoomPhotos(
  roomId: string,
  swaps: { photoId: string; newSlot: number }[],
) {
  const session = await requireSession();
  const userId = session.user.id;
  const restricted = await requireNotRestricted(userId);
  if (restricted) return restricted;

  if (swaps.length === 0) return {};
  if (swaps.some((s) => s.newSlot < 1 || s.newSlot > 10)) return { error: "uploadFailed" as const };

  await requireRoomOwnership(roomId, userId);

  try {
    const ids = swaps.map((s) => s.photoId);

    await createDrizzleSupabaseClient(userId).rls(async (tx) => {
      const existing = await tx
        .select({ id: roomPhotos.id })
        .from(roomPhotos)
        .where(and(eq(roomPhotos.roomId, roomId), inArray(roomPhotos.id, ids)));

      if (existing.length !== swaps.length) throw new Error("Photo not found");

      // Phase 1: set to negative temp values to avoid unique constraint
      for (const swap of swaps) {
        await tx
          .update(roomPhotos)
          .set({ slot: -swap.newSlot })
          .where(eq(roomPhotos.id, swap.photoId));
      }

      // Phase 2: set to final positive values
      for (const swap of swaps) {
        await tx
          .update(roomPhotos)
          .set({ slot: swap.newSlot })
          .where(eq(roomPhotos.id, swap.photoId));
      }
    });

    revalidatePath(`/my-rooms/${roomId}`);
    return {};
  } catch (e: unknown) {
    console.error(e);
    return { error: "uploadFailed" as const };
  }
}
