"use server";

import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth-server";
import { pool } from "@/lib/db";
import type { EditRoomData, ShareLinkSettingsData } from "@/lib/schemas/room";
import { editRoomSchema, shareLinkSettingsSchema } from "@/lib/schemas/room";

async function verifyRoomOwnership(roomId: string, userId: string) {
  const { rows } = await pool.query("SELECT id FROM rooms WHERE id = $1 AND created_by = $2", [
    roomId,
    userId,
  ]);
  if (rows.length === 0) throw new Error("Room not found");
}

export async function updateRoom(roomId: string, data: EditRoomData) {
  const session = await requireSession("nl");
  const parsed = editRoomSchema.safeParse(data);
  if (!parsed.success) return { error: "Invalid data" };

  await verifyRoomOwnership(roomId, session.user.id);

  const d = parsed.data;
  await pool.query(
    `UPDATE rooms SET
       title = $1, description = $2, city = $3, neighborhood = $4, address = $5,
       rent_price = $6, deposit = $7, utilities_included = $8, room_size_m2 = $9,
       available_from = $10, available_until = $11, rental_type = $12, house_type = $13,
       furnishing = $14, total_housemates = $15,
       features = $16, location_tags = $17, preferred_gender = $18,
       preferred_age_min = $19, preferred_age_max = $20, preferred_lifestyle_tags = $21,
       room_vereniging = $22
     WHERE id = $23`,
    [
      d.title,
      d.description || null,
      d.city,
      d.neighborhood || null,
      d.address || null,
      d.rent_price,
      d.deposit || null,
      d.utilities_included ?? false,
      d.room_size_m2 || null,
      d.available_from,
      d.rental_type === "vast" ? null : d.available_until || null,
      d.rental_type,
      d.house_type || null,
      d.furnishing || null,
      d.total_housemates || null,
      d.features ?? [],
      d.location_tags ?? [],
      d.preferred_gender || "geen_voorkeur",
      d.preferred_age_min || null,
      d.preferred_age_max || null,
      d.preferred_lifestyle_tags ?? [],
      d.room_vereniging || null,
      roomId,
    ],
  );

  revalidatePath(`/my-rooms/${roomId}`);
  return { success: true };
}

export async function updateRoomStatus(roomId: string, status: string) {
  const session = await requireSession("nl");
  await verifyRoomOwnership(roomId, session.user.id);

  // Validate status transitions
  const { rows } = await pool.query("SELECT status FROM rooms WHERE id = $1", [roomId]);
  const current = rows[0]?.status;

  const validTransitions: Record<string, string[]> = {
    draft: ["active"],
    active: ["paused", "closed"],
    paused: ["active", "closed"],
  };

  if (!validTransitions[current]?.includes(status)) {
    return { error: "Invalid status transition" };
  }

  // Publishing requires at least 1 photo
  if (current === "draft" && status === "active") {
    const { rows: photoRows } = await pool.query(
      "SELECT COUNT(*)::int AS count FROM room_photos WHERE room_id = $1",
      [roomId],
    );
    if (photoRows[0].count === 0) return { error: "publishError" };
  }

  await pool.query("UPDATE rooms SET status = $1 WHERE id = $2", [status, roomId]);

  revalidatePath(`/my-rooms/${roomId}`);
  revalidatePath("/my-rooms");
  return { success: true };
}

export async function regenerateShareLink(roomId: string) {
  const session = await requireSession("nl");
  await verifyRoomOwnership(roomId, session.user.id);

  await pool.query(
    "UPDATE rooms SET share_link = gen_random_uuid()::TEXT, share_link_use_count = 0 WHERE id = $1",
    [roomId],
  );

  revalidatePath(`/my-rooms/${roomId}`);
  return { success: true };
}

export async function updateShareLinkSettings(roomId: string, data: ShareLinkSettingsData) {
  const session = await requireSession("nl");
  const parsed = shareLinkSettingsSchema.safeParse(data);
  if (!parsed.success) return { error: "Invalid data" };

  await verifyRoomOwnership(roomId, session.user.id);

  await pool.query(
    "UPDATE rooms SET share_link_expires_at = $1, share_link_max_uses = $2 WHERE id = $3",
    [parsed.data.share_link_expires_at || null, parsed.data.share_link_max_uses || null, roomId],
  );

  revalidatePath(`/my-rooms/${roomId}`);
  return { success: true };
}
