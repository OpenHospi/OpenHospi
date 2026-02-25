"use server";

import { withRLS } from "@openhospi/database";
import { applications, housemates, rooms } from "@openhospi/database/schema";
import type { ApplyToRoomData } from "@openhospi/database/validators";
import { applyToRoomSchema } from "@openhospi/database/validators";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth-server";

export async function applyToRoom(roomId: string, data: ApplyToRoomData) {
  const session = await requireSession("nl");
  const parsed = applyToRoomSchema.safeParse(data);
  if (!parsed.success) return { error: "invalid_data" };

  return withRLS(session.user.id, async (tx) => {
    const [room] = await tx
      .select({ status: rooms.status })
      .from(rooms)
      .where(eq(rooms.id, roomId));
    if (!room || room.status !== "active") {
      return { error: "room_not_active" };
    }

    const [housemate] = await tx
      .select({ id: housemates.id })
      .from(housemates)
      .where(and(eq(housemates.roomId, roomId), eq(housemates.userId, session.user.id)));
    if (housemate) {
      return { error: "is_housemate" };
    }

    try {
      await tx.insert(applications).values({
        roomId,
        userId: session.user.id,
        personalMessage: parsed.data.personalMessage,
      });
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
  });
}
