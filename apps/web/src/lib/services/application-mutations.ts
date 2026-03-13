import { createDrizzleSupabaseClient } from "@/lib/db";
import { applications, houseMembers, houses, profiles, rooms } from "@/lib/db/schema";
import type { ApplyToRoomData } from "@openhospi/database/validators";
import { applyToRoomSchema } from "@openhospi/database/validators";
import {
  ApplicationStatus,
  RoomStatus,
  isValidApplicationTransition,
} from "@openhospi/shared/enums";
import { and, eq } from "drizzle-orm";

import { logStatusTransition } from "@/lib/queries/application-history";
import { checkRateLimit, rateLimiters } from "@/lib/services/rate-limit";

export async function applyToRoomForUser(userId: string, roomId: string, data: ApplyToRoomData) {
  const parsed = applyToRoomSchema.safeParse(data);
  if (!parsed.success) return { error: "invalid_data" as const };

  if (!(await checkRateLimit(rateLimiters.apply, userId))) {
    return { error: "RATE_LIMITED" as const };
  }

  return createDrizzleSupabaseClient(userId).rls(async (tx) => {
    const [profile] = await tx
      .select({ bio: profiles.bio })
      .from(profiles)
      .where(eq(profiles.id, userId));
    if (!profile?.bio) {
      return { error: "bio_required" as const };
    }

    const [room] = await tx
      .select({ status: rooms.status, houseId: rooms.houseId })
      .from(rooms)
      .where(eq(rooms.id, roomId));
    if (!room || room.status !== RoomStatus.active) {
      return { error: "room_not_active" as const };
    }

    const [member] = await tx
      .select({ id: houseMembers.id })
      .from(houseMembers)
      .innerJoin(houses, eq(houseMembers.houseId, houses.id))
      .where(and(eq(houseMembers.houseId, room.houseId), eq(houseMembers.userId, userId)));
    if (member) {
      return { error: "is_housemate" as const };
    }

    try {
      const [newApp] = await tx
        .insert(applications)
        .values({
          roomId,
          userId,
          personalMessage: parsed.data.personalMessage,
        })
        .returning({ id: applications.id });

      await logStatusTransition(tx, newApp.id, null, ApplicationStatus.sent, userId);
    } catch (e: unknown) {
      if (
        e instanceof Error &&
        e.message.includes("duplicate key value violates unique constraint")
      ) {
        return { error: "already_applied" as const };
      }
      throw e;
    }

    return { success: true };
  });
}

export async function withdrawApplicationForUser(userId: string, applicationId: string) {
  return createDrizzleSupabaseClient(userId).rls(async (tx) => {
    const [app] = await tx
      .select({ roomId: applications.roomId, status: applications.status })
      .from(applications)
      .where(and(eq(applications.id, applicationId), eq(applications.userId, userId)));
    if (!app) return { error: "not_found" as const };

    if (
      !isValidApplicationTransition(app.status as ApplicationStatus, ApplicationStatus.withdrawn)
    ) {
      return { error: "cannot_withdraw" as const };
    }

    await tx
      .update(applications)
      .set({ status: ApplicationStatus.withdrawn })
      .where(eq(applications.id, applicationId));

    await logStatusTransition(
      tx,
      applicationId,
      app.status as ApplicationStatus,
      ApplicationStatus.withdrawn,
      userId,
    );

    return { success: true };
  });
}
