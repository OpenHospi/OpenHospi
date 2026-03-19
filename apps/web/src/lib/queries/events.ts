import { and, desc, eq, isNull, sql } from "drizzle-orm";

import { createDrizzleSupabaseClient } from "@openhospi/database";
import { hospiEvents, hospiInvitations, profiles } from "@openhospi/database/schema";

export type EventSummary = {
  id: string;
  title: string;
  eventDate: string;
  timeStart: string;
  timeEnd: string | null;
  location: string | null;
  cancelledAt: Date | null;
  createdAt: Date;
  invitedCount: number;
  attendingCount: number;
};

export type EventInvitee = {
  invitationId: string;
  userId: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  status: string | null;
  respondedAt: Date | null;
  declineReason: string | null;
};

export type EventDetail = {
  id: string;
  roomId: string;
  createdBy: string;
  title: string;
  description: string | null;
  eventDate: string;
  timeStart: string;
  timeEnd: string | null;
  location: string | null;
  rsvpDeadline: Date | null;
  maxAttendees: number | null;
  notes: string | null;
  cancelledAt: Date | null;
  createdAt: Date;
  invitees: EventInvitee[];
};

export async function getRoomEvents(roomId: string, userId: string): Promise<EventSummary[]> {
  return createDrizzleSupabaseClient(userId).rls(async (tx) => {
    const events = await tx
      .select({
        id: hospiEvents.id,
        title: hospiEvents.title,
        eventDate: hospiEvents.eventDate,
        timeStart: hospiEvents.timeStart,
        timeEnd: hospiEvents.timeEnd,
        location: hospiEvents.location,
        cancelledAt: hospiEvents.cancelledAt,
        createdAt: hospiEvents.createdAt,
        invitedCount: sql<number>`count(${hospiInvitations.id})::int`,
        attendingCount: sql<number>`count(case when ${hospiInvitations.status} = 'attending' then 1 end)::int`,
      })
      .from(hospiEvents)
      .leftJoin(hospiInvitations, eq(hospiInvitations.eventId, hospiEvents.id))
      .where(eq(hospiEvents.roomId, roomId))
      .groupBy(hospiEvents.id)
      .orderBy(desc(hospiEvents.eventDate));

    return events;
  });
}

export async function getEventDetail(eventId: string, userId: string): Promise<EventDetail | null> {
  return createDrizzleSupabaseClient(userId).rls(async (tx) => {
    const [event] = await tx.select().from(hospiEvents).where(eq(hospiEvents.id, eventId));

    if (!event) return null;

    const invitees = await tx
      .select({
        invitationId: hospiInvitations.id,
        userId: hospiInvitations.userId,
        firstName: profiles.firstName,
        lastName: profiles.lastName,
        avatarUrl: profiles.avatarUrl,
        status: hospiInvitations.status,
        respondedAt: hospiInvitations.respondedAt,
        declineReason: hospiInvitations.declineReason,
      })
      .from(hospiInvitations)
      .innerJoin(profiles, eq(profiles.id, hospiInvitations.userId))
      .where(eq(hospiInvitations.eventId, eventId));

    return { ...event, invitees } as EventDetail;
  });
}

export async function getActiveRoomEvents(roomId: string, userId: string): Promise<EventSummary[]> {
  return createDrizzleSupabaseClient(userId).rls(async (tx) => {
    const events = await tx
      .select({
        id: hospiEvents.id,
        title: hospiEvents.title,
        eventDate: hospiEvents.eventDate,
        timeStart: hospiEvents.timeStart,
        timeEnd: hospiEvents.timeEnd,
        location: hospiEvents.location,
        cancelledAt: hospiEvents.cancelledAt,
        createdAt: hospiEvents.createdAt,
        invitedCount: sql<number>`count(${hospiInvitations.id})::int`,
        attendingCount: sql<number>`count(case when ${hospiInvitations.status} = 'attending' then 1 end)::int`,
      })
      .from(hospiEvents)
      .leftJoin(hospiInvitations, eq(hospiInvitations.eventId, hospiEvents.id))
      .where(and(eq(hospiEvents.roomId, roomId), isNull(hospiEvents.cancelledAt)))
      .groupBy(hospiEvents.id)
      .orderBy(desc(hospiEvents.eventDate));

    return events;
  });
}
