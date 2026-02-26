"use server";

import { withRLS } from "@openhospi/database";
import { roomPhotos, rooms } from "@openhospi/database/schema";
import type { RoomBasicInfoData, RoomDetailsData, RoomPreferencesData } from "@openhospi/database/validators";
import { roomBasicInfoSchema, roomDetailsSchema, roomPreferencesSchema } from "@openhospi/database/validators";
import { GenderPreference, RentalType, RoomStatus } from "@openhospi/shared/enums";
import { and, count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { requireRoomOwnership, requireSession } from "@/lib/auth-server";
import { checkRateLimit, rateLimiters } from "@/lib/rate-limit";
import { createDraftRoom } from "@/lib/rooms";

export async function createDraftRoomAction(): Promise<{ id?: string; error?: string }> {
  const session = await requireSession();

  if (!(await checkRateLimit(rateLimiters.createRoom, session.user.id))) {
    return { error: "RATE_LIMITED" };
  }

  try {
    const id = await createDraftRoom(session.user.id);
    return { id };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create room";
    return { error: message };
  }
}

export async function saveBasicInfo(roomId: string, data: RoomBasicInfoData) {
  const session = await requireSession();
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
  const session = await requireSession();
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
        serviceCosts: d.serviceCosts != null ? String(d.serviceCosts) : null,
        roomSizeM2: d.roomSizeM2 || null,
        availableFrom: d.availableFrom,
        availableUntil: d.rentalType === RentalType.vast ? null : d.availableUntil || null,
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
  const session = await requireSession();
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
        preferredGender: d.preferredGender || GenderPreference.geen_voorkeur,
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
  const session = await requireSession();
  await requireRoomOwnership(roomId, session.user.id);

  return withRLS(session.user.id, async (tx) => {
    const [photoCount] = await tx
      .select({ count: count() })
      .from(roomPhotos)
      .where(eq(roomPhotos.roomId, roomId));
    if (photoCount.count === 0) {
      return { error: "publishError" };
    }

    await tx
      .update(rooms)
      .set({ status: RoomStatus.active })
      .where(and(eq(rooms.id, roomId), eq(rooms.status, RoomStatus.draft)));

    revalidatePath("/my-rooms");
    return { success: true };
  });
}
