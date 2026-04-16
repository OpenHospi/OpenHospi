import { createDrizzleSupabaseClient } from "@openhospi/database";
import { applications, houseMembers, houses, profiles, rooms } from "@openhospi/database/schema";
import { REVIEWER_INSTITUTION_DOMAIN } from "@openhospi/shared/constants";
import {
  ApplicationStatus,
  RoomStatus,
  isValidApplicationTransition,
} from "@openhospi/shared/enums";
import { ApplicationError, CommonError } from "@openhospi/shared/error-codes";
import type { ApplyToRoomData } from "@openhospi/validators";
import { applyToRoomSchema } from "@openhospi/validators";
import { and, eq } from "drizzle-orm";

import { logStatusTransition } from "@/lib/queries/application-history";
import { checkRateLimit, rateLimiters } from "@/lib/services/rate-limit";

export async function applyToRoomForUser(userId: string, roomId: string, data: ApplyToRoomData) {
  const parsed = applyToRoomSchema.safeParse(data);
  if (!parsed.success) return { error: CommonError.invalid_data };

  if (!(await checkRateLimit(rateLimiters.apply, userId))) {
    return { error: CommonError.rate_limited };
  }

  return createDrizzleSupabaseClient(userId).rls(async (tx) => {
    const [profile] = await tx
      .select({ bio: profiles.bio, institutionDomain: profiles.institutionDomain })
      .from(profiles)
      .where(eq(profiles.id, userId));
    if (profile?.institutionDomain === REVIEWER_INSTITUTION_DOMAIN) {
      return { error: CommonError.invalid_data };
    }
    if (!profile?.bio) {
      return { error: ApplicationError.bio_required };
    }

    const [room] = await tx
      .select({ status: rooms.status, houseId: rooms.houseId })
      .from(rooms)
      .where(eq(rooms.id, roomId));
    if (!room || room.status !== RoomStatus.active) {
      return { error: ApplicationError.room_not_active };
    }

    const [member] = await tx
      .select({ id: houseMembers.id })
      .from(houseMembers)
      .innerJoin(houses, eq(houseMembers.houseId, houses.id))
      .where(and(eq(houseMembers.houseId, room.houseId), eq(houseMembers.userId, userId)));
    if (member) {
      return { error: ApplicationError.is_housemate };
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
        return { error: ApplicationError.already_applied };
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
    if (!app) return { error: CommonError.not_found };

    if (
      !isValidApplicationTransition(app.status as ApplicationStatus, ApplicationStatus.withdrawn)
    ) {
      return { error: ApplicationError.cannot_withdraw };
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
