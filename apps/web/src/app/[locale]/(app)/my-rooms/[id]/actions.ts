"use server";

import { withRLS } from "@openhospi/database";
import { roomPhotos, rooms } from "@openhospi/database/schema";
import type { EditRoomData, ShareLinkSettingsData } from "@openhospi/database/validators";
import { editRoomSchema, shareLinkSettingsSchema } from "@openhospi/database/validators";
import { DEFAULT_GENDER_PREFERENCE } from "@openhospi/shared/constants";
import { isValidRoomTransition } from "@openhospi/shared/enums";
import type { RoomStatus } from "@openhospi/shared/enums";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

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
        address: d.address || null,
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
        features: d.features ?? [],
        locationTags: d.locationTags ?? [],
        preferredGender: d.preferredGender || DEFAULT_GENDER_PREFERENCE,
        preferredAgeMin: d.preferredAgeMin || null,
        preferredAgeMax: d.preferredAgeMax || null,
        preferredLifestyleTags: d.preferredLifestyleTags ?? [],
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

    if (current === "draft" && status === "active") {
      const [photoCount] = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(roomPhotos)
        .where(eq(roomPhotos.roomId, roomId));
      if (photoCount.count === 0) return { error: "publishError" };
    }

    await tx
      .update(rooms)
      .set({ status: status as "draft" | "active" | "paused" | "closed" })
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
