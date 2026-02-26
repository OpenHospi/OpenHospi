"use server";

import { db } from "@openhospi/database";
import { housemates, rooms } from "@openhospi/database/schema";
import { DEFAULT_HOUSEMATE_ROLE } from "@openhospi/shared/constants";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth-server";
import { checkRateLimit, rateLimiters } from "@/lib/rate-limit";

type JoinResult =
  | { success: true; roomId: string }
  | { error: "INVALID_LINK" | "LINK_EXPIRED" | "LINK_MAX_USED" | "ALREADY_MEMBER" | "IS_OWNER" | "ROOM_NOT_ACTIVE" | "RATE_LIMITED" };

export async function joinViaShareLink(code: string): Promise<JoinResult> {
  const session = await requireSession();
  const userId = session.user.id;

  if (!(await checkRateLimit(rateLimiters.joinShareLink, userId))) {
    return { error: "RATE_LIMITED" };
  }

  return db.transaction(async (tx) => {
    // Lock the room row to prevent race conditions on shareLinkUseCount
    const [room] = await tx
      .select({
        id: rooms.id,
        ownerId: rooms.ownerId,
        status: rooms.status,
        shareLinkExpiresAt: rooms.shareLinkExpiresAt,
        shareLinkMaxUses: rooms.shareLinkMaxUses,
        shareLinkUseCount: rooms.shareLinkUseCount,
      })
      .from(rooms)
      .where(eq(rooms.shareLink, code))
      .for("update");

    if (!room) return { error: "INVALID_LINK" };
    if (room.status !== "active") return { error: "ROOM_NOT_ACTIVE" };
    if (room.ownerId === userId) return { error: "IS_OWNER" };

    if (room.shareLinkExpiresAt && new Date() > new Date(room.shareLinkExpiresAt)) {
      return { error: "LINK_EXPIRED" };
    }

    if (room.shareLinkMaxUses != null && (room.shareLinkUseCount ?? 0) >= room.shareLinkMaxUses) {
      return { error: "LINK_MAX_USED" };
    }

    // Check not already a housemate
    const [existing] = await tx
      .select({ id: housemates.id })
      .from(housemates)
      .where(
        sql`${housemates.roomId} = ${room.id} AND ${housemates.userId} = ${userId}`,
      );
    if (existing) return { error: "ALREADY_MEMBER" };

    // Insert housemate + increment use count atomically
    await tx.insert(housemates).values({
      roomId: room.id,
      userId,
      role: DEFAULT_HOUSEMATE_ROLE,
    });

    await tx
      .update(rooms)
      .set({ shareLinkUseCount: sql`COALESCE(${rooms.shareLinkUseCount}, 0) + 1` })
      .where(eq(rooms.id, room.id));

    revalidatePath("/my-rooms");
    return { success: true, roomId: room.id };
  });
}
