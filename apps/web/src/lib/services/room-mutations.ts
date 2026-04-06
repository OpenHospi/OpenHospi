import { createDrizzleSupabaseClient } from "@openhospi/database";
import { houseMembers, houses, roomPhotos, rooms } from "@openhospi/database/schema";
import { STORAGE_BUCKET_ROOM_PHOTOS } from "@openhospi/shared/constants";
import {
  GenderPreference,
  HouseMemberRole,
  isValidRoomTransition,
  RentalType,
  RoomStatus,
  UtilitiesIncluded,
} from "@openhospi/shared/enums";
import { CommonError, RoomError } from "@openhospi/shared/error-codes";
import type {
  EditRoomData,
  RoomBasicInfoData,
  RoomDetailsData,
  RoomPreferencesData,
  ShareLinkSettingsData,
} from "@openhospi/validators";
import {
  editRoomSchema,
  roomBasicInfoSchema,
  roomDetailsSchema,
  roomPreferencesSchema,
  roomPhotoCaptionSchema,
  shareLinkSettingsSchema,
} from "@openhospi/validators";
import { and, count, eq, inArray, sql } from "drizzle-orm";

import { requireRoomOwnership } from "@/lib/auth/server";
import { createDraftRoom, getExistingDraft } from "@/lib/queries/rooms";
import { deletePhotoFromStorage, uploadPhotoToStorage } from "@/lib/services/photos";
import { checkRateLimit, rateLimiters } from "@/lib/services/rate-limit";

// ── House + Draft Creation ──────────────────────────────────

export async function createHouseAndDraft(userId: string, name: string) {
  if (!(await checkRateLimit(rateLimiters.createRoom, userId))) {
    return { error: CommonError.rate_limited };
  }

  if (!name || name.trim().length < 2) {
    return { error: RoomError.invalid_name };
  }

  const houseId = crypto.randomUUID();

  await createDrizzleSupabaseClient(userId).rls(async (tx) => {
    await tx.insert(houses).values({
      id: houseId,
      name: name.trim(),
      createdBy: userId,
    });

    await tx.insert(houseMembers).values({
      houseId,
      userId,
      role: HouseMemberRole.owner,
    });
  });

  try {
    const roomId = await createDraftRoom(userId, houseId);
    return { id: roomId };
  } catch (e: unknown) {
    console.error(e);
    return { error: RoomError.create_failed };
  }
}

export async function createDraftForHouse(userId: string, houseId: string) {
  if (!(await checkRateLimit(rateLimiters.createRoom, userId))) {
    return { error: CommonError.rate_limited };
  }

  const membership = await createDrizzleSupabaseClient(userId).rls(async (tx) => {
    const [row] = await tx
      .select({ houseId: houseMembers.houseId })
      .from(houseMembers)
      .where(
        and(
          eq(houseMembers.userId, userId),
          eq(houseMembers.houseId, houseId),
          eq(houseMembers.role, HouseMemberRole.owner),
        ),
      );
    return row;
  });

  if (!membership) {
    return { error: RoomError.no_house };
  }

  try {
    const existingId = await getExistingDraft(userId, houseId);
    const roomId = existingId ?? (await createDraftRoom(userId, houseId));
    return { id: roomId };
  } catch (e: unknown) {
    console.error(e);
    return { error: RoomError.create_failed };
  }
}

// ── Wizard Step Saves ───────────────────────────────────────

export async function saveRoomBasicInfo(userId: string, roomId: string, data: RoomBasicInfoData) {
  const parsed = roomBasicInfoSchema.safeParse(data);
  if (!parsed.success) return { error: CommonError.invalid_data };

  await requireRoomOwnership(roomId, userId);

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

  await createDrizzleSupabaseClient(userId).rls((tx) =>
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

export async function saveRoomDetails(userId: string, roomId: string, data: RoomDetailsData) {
  const parsed = roomDetailsSchema.safeParse(data);
  if (!parsed.success) return { error: CommonError.invalid_data };

  await requireRoomOwnership(roomId, userId);

  const d = parsed.data;
  await createDrizzleSupabaseClient(userId).rls((tx) =>
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

export async function saveRoomPreferences(
  userId: string,
  roomId: string,
  data: RoomPreferencesData,
) {
  const parsed = roomPreferencesSchema.safeParse(data);
  if (!parsed.success) return { error: CommonError.invalid_data };

  await requireRoomOwnership(roomId, userId);

  const d = parsed.data;
  await createDrizzleSupabaseClient(userId).rls((tx) =>
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

export async function publishRoomForUser(userId: string, roomId: string) {
  await requireRoomOwnership(roomId, userId);

  return createDrizzleSupabaseClient(userId).rls(async (tx) => {
    const [photoCount] = await tx
      .select({ count: count() })
      .from(roomPhotos)
      .where(eq(roomPhotos.roomId, roomId));
    if (photoCount.count === 0) {
      return { error: RoomError.publish_error };
    }

    await tx
      .update(rooms)
      .set({ status: RoomStatus.active })
      .where(and(eq(rooms.id, roomId), eq(rooms.status, RoomStatus.draft)));

    return { success: true };
  });
}

// ── Room Management ─────────────────────────────────────────

export async function updateRoomForUser(userId: string, roomId: string, data: EditRoomData) {
  const parsed = editRoomSchema.safeParse(data);
  if (!parsed.success) return { error: CommonError.invalid_data };

  await requireRoomOwnership(roomId, userId);

  const d = parsed.data;
  await createDrizzleSupabaseClient(userId).rls((tx) =>
    tx
      .update(rooms)
      .set({
        title: d.title,
        description: d.description || null,
        city: d.city,
        neighborhood: d.neighborhood || null,
        streetName: d.streetName || null,
        houseNumber: d.houseNumber || null,
        postalCode: d.postalCode || null,
        latitude: d.latitude ?? null,
        longitude: d.longitude ?? null,
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

export async function updateRoomStatusForUser(userId: string, roomId: string, status: string) {
  await requireRoomOwnership(roomId, userId);

  return createDrizzleSupabaseClient(userId).rls(async (tx) => {
    const [room] = await tx
      .select({ status: rooms.status })
      .from(rooms)
      .where(eq(rooms.id, roomId));
    const current = room?.status as RoomStatus;

    if (!isValidRoomTransition(current, status as RoomStatus)) {
      return { error: CommonError.invalid_transition };
    }

    if (current === RoomStatus.draft && status === RoomStatus.active) {
      const [photoCount] = await tx
        .select({ count: count() })
        .from(roomPhotos)
        .where(eq(roomPhotos.roomId, roomId));
      if (photoCount.count === 0) return { error: RoomError.publish_error };
    }

    await tx
      .update(rooms)
      .set({ status: status as RoomStatus })
      .where(eq(rooms.id, roomId));

    return { success: true };
  });
}

export async function deleteRoomForUser(userId: string, roomId: string) {
  await requireRoomOwnership(roomId, userId);

  await createDrizzleSupabaseClient(userId).rls(async (tx) => {
    const [room] = await tx
      .select({ status: rooms.status })
      .from(rooms)
      .where(eq(rooms.id, roomId));

    if (room?.status !== RoomStatus.draft) {
      throw new Error("Only draft rooms can be deleted");
    }

    await tx.delete(rooms).where(and(eq(rooms.id, roomId), eq(rooms.status, RoomStatus.draft)));
  });

  return { success: true };
}

export async function regenerateShareLinkForUser(userId: string, roomId: string) {
  await requireRoomOwnership(roomId, userId);

  await createDrizzleSupabaseClient(userId).rls((tx) =>
    tx
      .update(rooms)
      .set({
        shareLink: sql`gen_random_uuid()::text`,
        shareLinkUseCount: 0,
      })
      .where(eq(rooms.id, roomId)),
  );

  return { success: true };
}

export async function updateShareLinkSettingsForUser(
  userId: string,
  roomId: string,
  data: ShareLinkSettingsData,
) {
  const parsed = shareLinkSettingsSchema.safeParse(data);
  if (!parsed.success) return { error: CommonError.invalid_data };

  await requireRoomOwnership(roomId, userId);

  await createDrizzleSupabaseClient(userId).rls((tx) =>
    tx
      .update(rooms)
      .set({
        shareLinkExpiresAt: parsed.data.shareLinkExpiresAt
          ? new Date(parsed.data.shareLinkExpiresAt)
          : null,
        shareLinkMaxUses: parsed.data.shareLinkMaxUses || null,
      })
      .where(eq(rooms.id, roomId)),
  );

  return { success: true };
}

// ── Photo Management ────────────────────────────────────────

export async function saveRoomPhotoForUser(
  userId: string,
  file: File,
  roomId: string,
  slot: number,
  flagged = false,
) {
  if (!file) return { error: CommonError.upload_failed };
  if (slot < 1 || slot > 10) return { error: CommonError.upload_failed };

  await requireRoomOwnership(roomId, userId);

  let url: string | undefined;

  try {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${roomId}/slot-${slot}.${ext}`;
    url = await uploadPhotoToStorage(file, STORAGE_BUCKET_ROOM_PHOTOS, path);

    const photoUrl = url;
    const moderationStatus = flagged ? ("pending_review" as const) : ("approved" as const);
    const [photo] = await createDrizzleSupabaseClient(userId).rls((tx) =>
      tx
        .insert(roomPhotos)
        .values({ roomId, slot, url: photoUrl, moderationStatus })
        .onConflictDoUpdate({
          target: [roomPhotos.roomId, roomPhotos.slot],
          set: { url: photoUrl, moderationStatus, uploadedAt: new Date() },
        })
        .returning(),
    );

    return { photo };
  } catch (e: unknown) {
    if (url) await deletePhotoFromStorage(url).catch(() => {});
    console.error(e);
    return { error: CommonError.upload_failed };
  }
}

export async function deleteRoomPhotoForUser(userId: string, roomId: string, slot: number) {
  if (slot < 1 || slot > 10) return { error: CommonError.delete_failed };

  await requireRoomOwnership(roomId, userId);

  try {
    const [photo] = await createDrizzleSupabaseClient(userId).rls((tx) =>
      tx
        .select({ url: roomPhotos.url })
        .from(roomPhotos)
        .where(and(eq(roomPhotos.roomId, roomId), eq(roomPhotos.slot, slot))),
    );

    if (!photo) return { error: CommonError.delete_failed };

    await deletePhotoFromStorage(photo.url);

    await createDrizzleSupabaseClient(userId).rls((tx) =>
      tx.delete(roomPhotos).where(and(eq(roomPhotos.roomId, roomId), eq(roomPhotos.slot, slot))),
    );

    return { success: true };
  } catch (e: unknown) {
    console.error(e);
    return { error: CommonError.delete_failed };
  }
}

export async function updatePhotoCaptionForUser(
  userId: string,
  roomId: string,
  slot: number,
  caption: string | null,
) {
  if (slot < 1 || slot > 10) return { error: CommonError.invalid_data };

  if (caption !== null) {
    const parsed = roomPhotoCaptionSchema.safeParse({ caption });
    if (!parsed.success) return { error: CommonError.invalid_data };
  }

  await requireRoomOwnership(roomId, userId);

  try {
    await createDrizzleSupabaseClient(userId).rls((tx) =>
      tx
        .update(roomPhotos)
        .set({ caption })
        .where(and(eq(roomPhotos.roomId, roomId), eq(roomPhotos.slot, slot))),
    );

    return { success: true };
  } catch (e: unknown) {
    console.error(e);
    return { error: CommonError.upload_failed };
  }
}

export async function reorderRoomPhotosForUser(
  userId: string,
  roomId: string,
  swaps: { photoId: string; newSlot: number }[],
) {
  if (swaps.length === 0) return { success: true };
  if (swaps.some((s) => s.newSlot < 1 || s.newSlot > 10))
    return { error: CommonError.upload_failed };

  await requireRoomOwnership(roomId, userId);

  try {
    const ids = swaps.map((s) => s.photoId);

    await createDrizzleSupabaseClient(userId).rls(async (tx) => {
      const existing = await tx
        .select({ id: roomPhotos.id })
        .from(roomPhotos)
        .where(and(eq(roomPhotos.roomId, roomId), inArray(roomPhotos.id, ids)));

      if (existing.length !== swaps.length) throw new Error("Photo not found");

      for (const swap of swaps) {
        await tx
          .update(roomPhotos)
          .set({ slot: -swap.newSlot })
          .where(eq(roomPhotos.id, swap.photoId));
      }

      for (const swap of swaps) {
        await tx
          .update(roomPhotos)
          .set({ slot: swap.newSlot })
          .where(eq(roomPhotos.id, swap.photoId));
      }
    });

    return { success: true };
  } catch (e: unknown) {
    console.error(e);
    return { error: CommonError.upload_failed };
  }
}
