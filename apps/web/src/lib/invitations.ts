import { withRLS } from "@openhospi/database";
import { hospiEvents, hospiInvitations, rooms } from "@openhospi/database/schema";
import type { InvitationStatus } from "@openhospi/shared/enums";
import { InvitationStatus as IS } from "@openhospi/shared/enums";
import { eq } from "drizzle-orm";

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
  return withRLS(userId, async (tx) => {
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
      .where(eq(hospiInvitations.userId, userId));

    // Apply location privacy: only show full address when attending or maybe
    return rows.map((row) => ({
      ...row,
      location:
        row.status === IS.attending || row.status === IS.maybe
          ? row.location
          : null,
    }));
  });
}
