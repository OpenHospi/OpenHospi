"use server";

import { createDrizzleSupabaseClient } from "@/lib/db";
import { houseMembers, houses, roomPhotos, rooms } from "@/lib/db/schema";
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
import {
  GenderPreference,
  HouseMemberRole,
  RentalType,
  RoomStatus,
  UtilitiesIncluded,
} from "@openhospi/shared/enums";
import { and, count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { requireNotRestricted, requireRoomOwnership, requireSession } from "@/lib/auth/server";
import { createDraftRoom, getExistingDraft } from "@/lib/queries/rooms";
import { checkRateLimit, rateLimiters } from "@/lib/services/rate-limit";

export async function createHouseAndContinue(formData: FormData) {
  const session = await requireSession();
  const restricted = await requireNotRestricted(session.user.id);
  if (restricted) return restricted;

  if (!(await checkRateLimit(rateLimiters.createRoom, session.user.id))) {
    return { error: "RATE_LIMITED" as const };
  }

  const name = formData.get("name") as string;
  if (!name || name.trim().length < 2) {
    return { error: "INVALID_NAME" as const };
  }

  const houseId = crypto.randomUUID();

  await createDrizzleSupabaseClient(session.user.id).rls(async (tx) => {
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
  } catch (e: unknown) {
    console.error(e);
    return { error: "createFailed" as const };
  }
}

export async function createDraftRoomForHouse(houseId: string) {
  const session = await requireSession();
  const restricted = await requireNotRestricted(session.user.id);
  if (restricted) return restricted;

  if (!(await checkRateLimit(rateLimiters.createRoom, session.user.id))) {
    return { error: "RATE_LIMITED" as const };
  }

  // Verify user owns this house
  const membership = await createDrizzleSupabaseClient(session.user.id).rls(async (tx) => {
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
    return { error: "NO_HOUSE" as const };
  }

  try {
    const existingId = await getExistingDraft(session.user.id, houseId);
    const roomId = existingId ?? (await createDraftRoom(session.user.id, houseId));
    return { id: roomId };
  } catch (e: unknown) {
    console.error(e);
    return { error: "createFailed" as const };
  }
}

export async function saveBasicInfo(roomId: string, data: RoomBasicInfoData) {
  const session = await requireSession();
  const restricted = await requireNotRestricted(session.user.id);
  if (restricted) return restricted;

  const parsed = roomBasicInfoSchema.safeParse(data);
  if (!parsed.success) return { error: "invalidData" as const };

  await requireRoomOwnership(roomId, session.user.id);

  const {
    title,
    description,
    city,
    neighborhood,
    streetName,
    houseNumber,
    postalCode,
    latitude,
    longitude,
  } = parsed.data;
  await createDrizzleSupabaseClient(session.user.id).rls((tx) =>
    tx
      .update(rooms)
      .set({
        title,
        description: description || null,
        city,
        neighborhood: neighborhood || null,
        streetName: streetName || null,
        houseNumber: houseNumber || null,
        postalCode: postalCode || null,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
      })
      .where(eq(rooms.id, roomId)),
  );

  return { success: true };
}

export async function saveDetails(roomId: string, data: RoomDetailsData) {
  const session = await requireSession();
  const restricted = await requireNotRestricted(session.user.id);
  if (restricted) return restricted;

  const parsed = roomDetailsSchema.safeParse(data);
  if (!parsed.success) return { error: "invalidData" as const };

  await requireRoomOwnership(roomId, session.user.id);

  const d = parsed.data;
  await createDrizzleSupabaseClient(session.user.id).rls((tx) =>
    tx
      .update(rooms)
      .set({
        rentPrice: String(d.rentPrice),
        deposit: d.deposit != null ? String(d.deposit) : null,
        utilitiesIncluded: d.utilitiesIncluded ?? UtilitiesIncluded.included,
        serviceCosts: d.serviceCosts != null ? String(d.serviceCosts) : null,
        estimatedUtilitiesCosts:
          d.utilitiesIncluded === UtilitiesIncluded.estimated && d.estimatedUtilitiesCosts != null
            ? String(d.estimatedUtilitiesCosts)
            : null,
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
  const restricted = await requireNotRestricted(session.user.id);
  if (restricted) return restricted;

  const parsed = roomPreferencesSchema.safeParse(data);
  if (!parsed.success) return { error: "invalidData" as const };

  await requireRoomOwnership(roomId, session.user.id);

  const d = parsed.data;
  await createDrizzleSupabaseClient(session.user.id).rls((tx) =>
    tx
      .update(rooms)
      .set({
        features: d.features ?? [],
        locationTags: d.locationTags ?? [],
        preferredGender: d.preferredGender || GenderPreference.no_preference,
        preferredAgeMin: d.preferredAgeMin || null,
        preferredAgeMax: d.preferredAgeMax || null,

        acceptedLanguages: d.acceptedLanguages ?? [],
        roomVereniging: d.roomVereniging || null,
      })
      .where(eq(rooms.id, roomId)),
  );

  return { success: true };
}

export async function publishRoom(roomId: string) {
  const session = await requireSession();
  const restricted = await requireNotRestricted(session.user.id);
  if (restricted) return restricted;

  await requireRoomOwnership(roomId, session.user.id);

  return createDrizzleSupabaseClient(session.user.id).rls(async (tx) => {
    const [photoCount] = await tx
      .select({ count: count() })
      .from(roomPhotos)
      .where(eq(roomPhotos.roomId, roomId));
    if (photoCount.count === 0) {
      return { error: "publishError" as const };
    }

    await tx
      .update(rooms)
      .set({ status: RoomStatus.active })
      .where(and(eq(rooms.id, roomId), eq(rooms.status, RoomStatus.draft)));

    revalidatePath("/my-rooms");
    return { success: true };
  });
}
