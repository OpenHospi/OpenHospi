"use server";

import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth-server";
import { pool } from "@/lib/db";
import { createDraftRoom } from "@/lib/rooms";
import type { RoomBasicInfoData, RoomDetailsData, RoomPreferencesData } from "@/lib/schemas/room";
import { roomBasicInfoSchema, roomDetailsSchema, roomPreferencesSchema } from "@/lib/schemas/room";

async function verifyRoomOwnership(roomId: string, userId: string) {
  const { rows } = await pool.query("SELECT id FROM rooms WHERE id = $1 AND created_by = $2", [
    roomId,
    userId,
  ]);
  if (rows.length === 0) throw new Error("Room not found");
}

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

  await verifyRoomOwnership(roomId, session.user.id);

  const { title, description, city, neighborhood, address } = parsed.data;
  await pool.query(
    `UPDATE rooms SET title = $1, description = $2, city = $3, neighborhood = $4, address = $5
     WHERE id = $6`,
    [title, description || null, city, neighborhood || null, address || null, roomId],
  );

  return { success: true };
}

export async function saveDetails(roomId: string, data: RoomDetailsData) {
  const session = await requireSession("nl");
  const parsed = roomDetailsSchema.safeParse(data);
  if (!parsed.success) return { error: "Invalid data" };

  await verifyRoomOwnership(roomId, session.user.id);

  const {
    rent_price,
    deposit,
    utilities_included,
    room_size_m2,
    available_from,
    available_until,
    rental_type,
    house_type,
    furnishing,
    total_housemates,
  } = parsed.data;

  await pool.query(
    `UPDATE rooms SET
       rent_price = $1, deposit = $2, utilities_included = $3, room_size_m2 = $4,
       available_from = $5, available_until = $6, rental_type = $7, house_type = $8,
       furnishing = $9, total_housemates = $10
     WHERE id = $11`,
    [
      rent_price,
      deposit || null,
      utilities_included ?? false,
      room_size_m2 || null,
      available_from,
      rental_type === "vast" ? null : available_until || null,
      rental_type,
      house_type || null,
      furnishing || null,
      total_housemates || null,
      roomId,
    ],
  );

  return { success: true };
}

export async function savePreferences(roomId: string, data: RoomPreferencesData) {
  const session = await requireSession("nl");
  const parsed = roomPreferencesSchema.safeParse(data);
  if (!parsed.success) return { error: "Invalid data" };

  await verifyRoomOwnership(roomId, session.user.id);

  const {
    features,
    location_tags,
    preferred_gender,
    preferred_age_min,
    preferred_age_max,
    preferred_lifestyle_tags,
    is_verenigingshuis,
    room_vereniging,
  } = parsed.data;

  await pool.query(
    `UPDATE rooms SET
       features = $1, location_tags = $2, preferred_gender = $3,
       preferred_age_min = $4, preferred_age_max = $5, preferred_lifestyle_tags = $6,
       is_verenigingshuis = $7, room_vereniging = $8
     WHERE id = $9`,
    [
      features ?? [],
      location_tags ?? [],
      preferred_gender || "geen_voorkeur",
      preferred_age_min || null,
      preferred_age_max || null,
      preferred_lifestyle_tags ?? [],
      is_verenigingshuis ?? false,
      is_verenigingshuis ? room_vereniging || null : null,
      roomId,
    ],
  );

  return { success: true };
}

export async function publishRoom(roomId: string) {
  const session = await requireSession("nl");
  await verifyRoomOwnership(roomId, session.user.id);

  // Check at least 1 photo
  const { rows: photoRows } = await pool.query(
    "SELECT COUNT(*)::int AS count FROM room_photos WHERE room_id = $1",
    [roomId],
  );
  if (photoRows[0].count === 0) {
    return { error: "publishError" };
  }

  await pool.query("UPDATE rooms SET status = 'active' WHERE id = $1 AND status = 'draft'", [
    roomId,
  ]);

  revalidatePath("/my-rooms");
  return { success: true };
}
