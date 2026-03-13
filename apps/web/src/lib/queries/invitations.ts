import { createDrizzleSupabaseClient } from "@/lib/db";
import { hospiEvents, hospiInvitations, rooms } from "@/lib/db/schema";
import { InvitationStatus } from "@openhospi/shared/enums";
import { and, eq } from "drizzle-orm";

import { notBlockedBy } from "@/lib/queries/block-filter";

export type UserInvitation = {
  invitationId: string;
  status: InvitationStatus;
  respondedAt: Date | null;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  timeStart: string;
  timeEnd: string | null;
  location: string | null;
  rsvpDeadline: Date | null;
  roomId: string;
  roomTitle: string;
  cancelledAt: Date | null;
};

export async function getUserInvitations(userId: string): Promise<UserInvitation[]> {
  return createDrizzleSupabaseClient(userId).rls(async (tx) => {
    const rows = await tx
      .select({
        invitationId: hospiInvitations.id,
        status: hospiInvitations.status,
        respondedAt: hospiInvitations.respondedAt,
        eventId: hospiEvents.id,
        eventTitle: hospiEvents.title,
        eventDate: hospiEvents.eventDate,
        timeStart: hospiEvents.timeStart,
        timeEnd: hospiEvents.timeEnd,
        location: hospiEvents.location,
        rsvpDeadline: hospiEvents.rsvpDeadline,
        roomId: rooms.id,
        roomTitle: rooms.title,
        cancelledAt: hospiEvents.cancelledAt,
      })
      .from(hospiInvitations)
      .innerJoin(hospiEvents, eq(hospiEvents.id, hospiInvitations.eventId))
      .innerJoin(rooms, eq(rooms.id, hospiEvents.roomId))
      .where(and(eq(hospiInvitations.userId, userId), notBlockedBy(rooms.ownerId, userId)));

    // status has .default("pending") so it's never null in practice
    return rows.map((row) => ({
      ...row,
      status: (row.status ?? InvitationStatus.pending) as InvitationStatus,
    }));
  });
}

export async function getInvitationForApplication(
  applicationId: string,
  userId: string,
): Promise<UserInvitation | null> {
  return createDrizzleSupabaseClient(userId).rls(async (tx) => {
    const [row] = await tx
      .select({
        invitationId: hospiInvitations.id,
        status: hospiInvitations.status,
        respondedAt: hospiInvitations.respondedAt,
        eventId: hospiEvents.id,
        eventTitle: hospiEvents.title,
        eventDate: hospiEvents.eventDate,
        timeStart: hospiEvents.timeStart,
        timeEnd: hospiEvents.timeEnd,
        location: hospiEvents.location,
        rsvpDeadline: hospiEvents.rsvpDeadline,
        roomId: rooms.id,
        roomTitle: rooms.title,
        cancelledAt: hospiEvents.cancelledAt,
      })
      .from(hospiInvitations)
      .innerJoin(hospiEvents, eq(hospiEvents.id, hospiInvitations.eventId))
      .innerJoin(rooms, eq(rooms.id, hospiEvents.roomId))
      .where(
        and(eq(hospiInvitations.applicationId, applicationId), eq(hospiInvitations.userId, userId)),
      );

    if (!row) return null;

    return {
      ...row,
      status: (row.status ?? InvitationStatus.pending) as InvitationStatus,
    };
  });
}
