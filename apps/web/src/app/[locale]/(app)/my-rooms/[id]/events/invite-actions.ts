"use server";

import { withRLS } from "@openhospi/database";
import {
  applications,
  houseMembers,
  hospiEvents,
  hospiInvitations,
  rooms,
} from "@openhospi/database/schema";
import {
  ApplicationStatus,
  INVITABLE_APPLICATION_STATUSES,
  isValidApplicationTransition,
} from "@openhospi/shared/enums";
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { logStatusTransition } from "@/lib/application-history";
import { requireHousemate, requireNotRestricted, requireSession } from "@/lib/auth-server";
import { getOrCreateHospiConversation } from "@/lib/chat";
import { notifyUser } from "@/lib/notifications";

export async function batchInviteApplicants(
  eventId: string,
  roomId: string,
  applicationIds: string[],
) {
  const session = await requireSession();
  const restricted = await requireNotRestricted(session.user.id);
  if (restricted) return restricted;

  await requireHousemate(roomId, session.user.id);

  if (applicationIds.length === 0) return { error: "no_applications" as const };

  await withRLS(session.user.id, async (tx) => {
    // Verify event exists and belongs to this room
    const [event] = await tx
      .select({ id: hospiEvents.id, title: hospiEvents.title, roomId: hospiEvents.roomId })
      .from(hospiEvents)
      .where(and(eq(hospiEvents.id, eventId), eq(hospiEvents.roomId, roomId)));
    if (!event) throw new Error("Event not found");

    // Get room title for notification
    const [room] = await tx.select({ title: rooms.title }).from(rooms).where(eq(rooms.id, roomId));

    // Verify and invite each application
    const apps = await tx
      .select({
        id: applications.id,
        userId: applications.userId,
        status: applications.status,
      })
      .from(applications)
      .where(
        and(
          inArray(applications.id, applicationIds),
          eq(applications.roomId, roomId),
          inArray(applications.status, [...INVITABLE_APPLICATION_STATUSES]),
        ),
      );

    for (const app of apps) {
      // Insert invitation (idempotent)
      await tx
        .insert(hospiInvitations)
        .values({
          eventId,
          userId: app.userId,
          applicationId: app.id,
        })
        .onConflictDoNothing();

      // Update application status to invited
      if (isValidApplicationTransition(app.status as ApplicationStatus, ApplicationStatus.hospi)) {
        await tx
          .update(applications)
          .set({ status: ApplicationStatus.hospi })
          .where(eq(applications.id, app.id));

        await logStatusTransition(
          tx,
          app.id,
          app.status as ApplicationStatus,
          ApplicationStatus.hospi,
          session.user.id,
        );
      }

      // Notify invitee
      await notifyUser(app.userId, "notifications.invited", {
        eventTitle: event.title,
        roomTitle: room?.title ?? "",
      });
    }

    // Auto-create chat conversations for each invitee
    // Get all house member user IDs
    const [roomData] = await tx
      .select({ houseId: rooms.houseId })
      .from(rooms)
      .where(eq(rooms.id, roomId));

    if (roomData) {
      const members = await tx
        .select({ userId: houseMembers.userId })
        .from(houseMembers)
        .where(eq(houseMembers.houseId, roomData.houseId));

      const memberIds = members.map((m) => m.userId);

      for (const app of apps) {
        await getOrCreateHospiConversation(roomId, app.userId, [...memberIds, app.userId]);
      }
    }
  });

  revalidatePath(`/my-rooms/${roomId}`);
  revalidatePath(`/my-rooms/${roomId}/events/${eventId}`);
  return { success: true, count: applicationIds.length };
}

export async function removeInvitation(invitationId: string, roomId: string) {
  const session = await requireSession();
  const restricted = await requireNotRestricted(session.user.id);
  if (restricted) return restricted;

  await withRLS(session.user.id, async (tx) => {
    await tx.delete(hospiInvitations).where(eq(hospiInvitations.id, invitationId));
  });

  revalidatePath(`/my-rooms/${roomId}`);
  return { success: true };
}
