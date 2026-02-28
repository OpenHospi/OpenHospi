"use server";

import { withRLS } from "@openhospi/database";
import { houseMembers, houses, roomPhotos, rooms } from "@openhospi/database/schema";
import type {
  RoomBasicInfoData,
  RoomDetailsData,
  RoomPreferencesData,
} from "@openhospi/database/validators";
import {
  roomBasicInfoSchema,
  roomDetailsSchema,
  roomPreferencesSchema,
} from "@openhospi/database/validators";
import { GenderPreference, HouseMemberRole, RentalType, RoomStatus } from "@openhospi/shared/enums";
import { and, count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { requireRoomOwnership, requireSession } from "@/lib/auth-server";
import { getUserOwnerHouses } from "@/lib/houses";
import { checkRateLimit, rateLimiters } from "@/lib/rate-limit";
import { createDraftRoom } from "@/lib/rooms";

export async function createDraftRoomAction(): Promise<{ id?: string; error?: string }> {
  const session = await requireSession();

  if (!(await checkRateLimit(rateLimiters.createRoom, session.user.id))) {
    return { error: "RATE_LIMITED" };
  }

  const userHouses = await getUserOwnerHouses(session.user.id);

  if (userHouses.length === 0) {
    return { error: "NO_HOUSE" };
  }

  if (userHouses.length === 1) {
    try {
      const id = await createDraftRoom(session.user.id, userHouses[0].id);
      return { id };
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to create room";
      return { error: message };
    }
  }

  // Multiple houses — the page should show house picker
  return { error: "PICK_HOUSE" };
}

export async function createHouseAndContinue(
  formData: FormData,
): Promise<{ id?: string; error?: string }> {
  const session = await requireSession();

  if (!(await checkRateLimit(rateLimiters.createRoom, session.user.id))) {
    return { error: "RATE_LIMITED" };
  }

  const name = formData.get("name") as string;
  if (!name || name.trim().length < 2) {
    return { error: "INVALID_NAME" };
  }

  const houseId = crypto.randomUUID();

  await withRLS(session.user.id, async (tx) => {
    await tx.insert(houses).values({
      id: houseId,
      name: name.trim(),
      createdBy: session.user.id,
    });

    await tx.insert(houseMembers).values({
      houseId,
      userId: session.user.id,
      role: HouseMemberRole.owner,
    });
  });

  try {
    const roomId = await createDraftRoom(session.user.id, houseId);
    revalidatePath("/my-house");
    return { id: roomId };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create room";
    return { error: message };
  }
}

export async function createDraftRoomForHouse(
  houseId: string,
): Promise<{ id?: string; error?: string }> {
  const session = await requireSession();

  if (!(await checkRateLimit(rateLimiters.createRoom, session.user.id))) {
    return { error: "RATE_LIMITED" };
  }

  // Verify user owns this house
  const membership = await withRLS(session.user.id, async (tx) => {
    const [row] = await tx
      .select({ houseId: houseMembers.houseId })
      .from(houseMembers)
      .where(
        and(
          eq(houseMembers.userId, session.user.id),
          eq(houseMembers.houseId, houseId),
          eq(houseMembers.role, HouseMemberRole.owner),
        ),
      );
    return row;
  });

  if (!membership) {
    return { error: "NO_HOUSE" };
  }

  try {
    const roomId = await createDraftRoom(session.user.id, houseId);
    return { id: roomId };
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
        availableUntil: d.rentalType === RentalType.permanent ? null : d.availableUntil || null,
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
        preferredGender: d.preferredGender || GenderPreference.no_preference,
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
