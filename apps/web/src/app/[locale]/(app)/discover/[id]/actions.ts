"use server";

import { withRLS } from "@openhospi/database";
import { applications, houseMembers, houses, rooms } from "@openhospi/database/schema";
import type { ApplyToRoomData } from "@openhospi/database/validators";
import { applyToRoomSchema } from "@openhospi/database/validators";
import { RoomStatus } from "@openhospi/shared/enums";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { requireNotRestricted, requireSession } from "@/lib/auth-server";
import { checkRateLimit, rateLimiters } from "@/lib/rate-limit";

export async function applyToRoom(roomId: string, data: ApplyToRoomData) {
  const session = await requireSession();
  const restricted = await requireNotRestricted(session.user.id);
  if (restricted) return restricted;

  const parsed = applyToRoomSchema.safeParse(data);
  if (!parsed.success) return { error: "invalid_data" };

  if (!(await checkRateLimit(rateLimiters.apply, session.user.id))) {
    return { error: "RATE_LIMITED" };
  }

  return withRLS(session.user.id, async (tx) => {
    const [room] = await tx
      .select({ status: rooms.status, houseId: rooms.houseId })
      .from(rooms)
      .where(eq(rooms.id, roomId));
    if (!room || room.status !== RoomStatus.active) {
      return { error: "room_not_active" };
    }

    const [member] = await tx
      .select({ id: houseMembers.id })
      .from(houseMembers)
      .innerJoin(houses, eq(houseMembers.houseId, houses.id))
      .where(and(eq(houseMembers.houseId, room.houseId), eq(houseMembers.userId, session.user.id)));
    if (member) {
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
