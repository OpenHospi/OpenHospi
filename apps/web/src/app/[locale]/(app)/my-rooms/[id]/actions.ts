"use server";

import { withRLS } from "@openhospi/database";
import { roomPhotos, rooms } from "@openhospi/database/schema";
import type { EditRoomData, ShareLinkSettingsData } from "@openhospi/database/validators";
import { editRoomSchema, shareLinkSettingsSchema } from "@openhospi/database/validators";
import {
  GenderPreference,
  isValidRoomTransition,
  RentalType,
  RoomStatus,
  UtilitiesIncluded,
} from "@openhospi/shared/enums";
import { and, count, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRoomOwnership, requireSession } from "@/lib/auth-server";

export async function updateRoom(roomId: string, data: EditRoomData) {
  const session = await requireSession();
  const parsed = editRoomSchema.safeParse(data);
  if (!parsed.success) return { error: "Invalid data" };

  await requireRoomOwnership(roomId, session.user.id);

  const d = parsed.data;
  await withRLS(session.user.id, (tx) =>
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

  revalidatePath(`/my-rooms/${roomId}`);
  return { success: true };
}

export async function updateRoomStatus(roomId: string, status: string) {
  const session = await requireSession();
  await requireRoomOwnership(roomId, session.user.id);

  return withRLS(session.user.id, async (tx) => {
    const [room] = await tx
      .select({ status: rooms.status })
      .from(rooms)
      .where(eq(rooms.id, roomId));
    const current = room?.status as RoomStatus;

    if (!isValidRoomTransition(current, status as RoomStatus)) {
      return { error: "Invalid status transition" };
    }

    if (current === RoomStatus.draft && status === RoomStatus.active) {
      const [photoCount] = await tx
        .select({ count: count() })
        .from(roomPhotos)
        .where(eq(roomPhotos.roomId, roomId));
      if (photoCount.count === 0) return { error: "publishError" };
    }

    await tx
      .update(rooms)
      .set({ status: status as RoomStatus })
      .where(eq(rooms.id, roomId));

    revalidatePath(`/my-rooms/${roomId}`);
    revalidatePath("/my-rooms");
    return { success: true };
  });
}

export async function regenerateShareLink(roomId: string) {
  const session = await requireSession();
  await requireRoomOwnership(roomId, session.user.id);

  await withRLS(session.user.id, (tx) =>
    tx
      .update(rooms)
      .set({
        shareLink: sql`gen_random_uuid()::text`,
        shareLinkUseCount: 0,
      })
      .where(eq(rooms.id, roomId)),
  );

  revalidatePath(`/my-rooms/${roomId}`);
  return { success: true };
}

export async function updateShareLinkSettings(roomId: string, data: ShareLinkSettingsData) {
  const session = await requireSession();
  const parsed = shareLinkSettingsSchema.safeParse(data);
  if (!parsed.success) return { error: "Invalid data" };

  await requireRoomOwnership(roomId, session.user.id);

  await withRLS(session.user.id, (tx) =>
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

  revalidatePath(`/my-rooms/${roomId}`);
  return { success: true };
}

export async function deleteRoom(roomId: string) {
  const session = await requireSession();
  await requireRoomOwnership(roomId, session.user.id);

  await withRLS(session.user.id, async (tx) => {
    const [room] = await tx
      .select({ status: rooms.status })
      .from(rooms)
      .where(eq(rooms.id, roomId));

    if (room?.status !== RoomStatus.draft) {
      throw new Error("Only draft rooms can be deleted");
    }

    await tx.delete(rooms).where(and(eq(rooms.id, roomId), eq(rooms.status, RoomStatus.draft)));
  });

  revalidatePath("/my-rooms");
  redirect("/my-rooms");
}
