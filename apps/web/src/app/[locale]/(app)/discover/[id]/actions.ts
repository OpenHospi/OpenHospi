"use server";

import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth-server";
import { pool } from "@/lib/db";
import type { ApplyToRoomData } from "@/lib/schemas/application";
import { applyToRoomSchema } from "@/lib/schemas/application";

export async function applyToRoom(roomId: string, data: ApplyToRoomData) {
  const session = await requireSession("nl");
  const parsed = applyToRoomSchema.safeParse(data);
  if (!parsed.success) return { error: "invalid_data" };

  // Verify room is active
  const { rows: roomRows } = await pool.query("SELECT status FROM rooms WHERE id = $1", [roomId]);
  if (roomRows.length === 0 || roomRows[0].status !== "active") {
    return { error: "room_not_active" };
  }

  // Verify user is not a housemate of this room
  const { rows: housemateRows } = await pool.query(
    "SELECT 1 FROM housemates WHERE room_id = $1 AND user_id = $2",
    [roomId, session.user.id],
  );
  if (housemateRows.length > 0) {
    return { error: "is_housemate" };
  }

  try {
    await pool.query(
      `INSERT INTO applications (room_id, user_id, personal_message)
       VALUES ($1, $2, $3)`,
      [roomId, session.user.id, parsed.data.personal_message],
    );
  } catch (e: unknown) {
    if (
      e instanceof Error &&
      e.message.includes("duplicate key value violates unique constraint")
    ) {
      return { error: "already_applied" };
    }
    throw e;
  }

  revalidatePath(`/discover/${roomId}`);
  revalidatePath("/applications");
  return { success: true };
}
