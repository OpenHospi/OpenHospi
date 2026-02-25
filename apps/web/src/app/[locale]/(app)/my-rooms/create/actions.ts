"use server";

import { withRLS } from "@openhospi/database";
import { roomPhotos, rooms } from "@openhospi/database/schema";
import type { RoomBasicInfoData, RoomDetailsData, RoomPreferencesData } from "@openhospi/database/validators";
import { roomBasicInfoSchema, roomDetailsSchema, roomPreferencesSchema } from "@openhospi/database/validators";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { requireRoomOwnership, requireSession } from "@/lib/auth-server";
import { createDraftRoom } from "@/lib/rooms";

export async function createDraftRoomAction(): Promise<{ id?: string; error?: string }> {
  const session = await requireSession("nl");
  try {
    const id = await createDraftRoom(session.user.id);
    return { id };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create room";
    return { error: message };
  }
}

export async function saveBasicInfo(roomId: string, data: RoomBasicInfoData) {
  const session = await requireSession("nl");
  const parsed = roomBasicInfoSchema.safeParse(data);
  if (!parsed.success) return { error: "Invalid data" };

  await requireRoomOwnership(roomId, session.user.id);

  const { title, description, city, neighborhood, address } = parsed.data;
  await withRLS(session.user.id, (tx) =>
    tx
      .update(rooms)
      .set({
        title,
        description: description || null,
        city,
        neighborhood: neighborhood || null,
        address: address || null,
      })
      .where(eq(rooms.id, roomId)),
  );

  return { success: true };
}

export async function saveDetails(roomId: string, data: RoomDetailsData) {
  const session = await requireSession("nl");
  const parsed = roomDetailsSchema.safeParse(data);
  if (!parsed.success) return { error: "Invalid data" };

  await requireRoomOwnership(roomId, session.user.id);

  const d = parsed.data;
  await withRLS(session.user.id, (tx) =>
    tx
      .update(rooms)
      .set({
        rentPrice: String(d.rentPrice),
        deposit: d.deposit != null ? String(d.deposit) : null,
        utilitiesIncluded: d.utilitiesIncluded ?? false,
        roomSizeM2: d.roomSizeM2 || null,
        availableFrom: d.availableFrom,
        availableUntil: d.rentalType === "vast" ? null : d.availableUntil || null,
        rentalType: d.rentalType,
        houseType: d.houseType || null,
        furnishing: d.furnishing || null,
        totalHousemates: d.totalHousemates || null,
      })
      .where(eq(rooms.id, roomId)),
  );

  return { success: true };
}

export async function savePreferences(roomId: string, data: RoomPreferencesData) {
  const session = await requireSession("nl");
  const parsed = roomPreferencesSchema.safeParse(data);
  if (!parsed.success) return { error: "Invalid data" };

  await requireRoomOwnership(roomId, session.user.id);

  const d = parsed.data;
  await withRLS(session.user.id, (tx) =>
    tx
      .update(rooms)
      .set({
        features: d.features ?? [],
        locationTags: d.locationTags ?? [],
        preferredGender: d.preferredGender || "geen_voorkeur",
        preferredAgeMin: d.preferredAgeMin || null,
        preferredAgeMax: d.preferredAgeMax || null,
        preferredLifestyleTags: d.preferredLifestyleTags ?? [],
        roomVereniging: d.roomVereniging || null,
      })
      .where(eq(rooms.id, roomId)),
  );

  return { success: true };
}

export async function publishRoom(roomId: string) {
  const session = await requireSession("nl");
  await requireRoomOwnership(roomId, session.user.id);

  return withRLS(session.user.id, async (tx) => {
    const [photoCount] = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(roomPhotos)
      .where(eq(roomPhotos.roomId, roomId));
    if (photoCount.count === 0) {
      return { error: "publishError" };
    }

    await tx
      .update(rooms)
      .set({ status: "active" })
      .where(and(eq(rooms.id, roomId), eq(rooms.status, "draft")));

    revalidatePath("/my-rooms");
    return { success: true };
  });
}
