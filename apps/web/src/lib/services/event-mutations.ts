import { createDrizzleSupabaseClient } from "@openhospi/database";
import { applications, hospiEvents, hospiInvitations, rooms } from "@openhospi/database/schema";
import { MAX_INVITATIONS_PER_EVENT } from "@openhospi/shared/constants";
import {
  ApplicationStatus,
  InvitationStatus,
  INVITABLE_APPLICATION_STATUSES,
  isValidApplicationTransition,
} from "@openhospi/shared/enums";
import { CommonError, EventError } from "@openhospi/shared/error-codes";
import type { CreateEventData } from "@openhospi/validators";
import { createEventSchema } from "@openhospi/validators";
import { and, eq, inArray, ne, sql } from "drizzle-orm";

import { requireHousemate } from "@/lib/auth/server";
import { logStatusTransition } from "@/lib/queries/application-history";
import { notifyUser } from "@/lib/queries/notifications";

export async function createEventForUser(userId: string, roomId: string, data: CreateEventData) {
  const parsed = createEventSchema.safeParse(data);
  if (!parsed.success) return { error: CommonError.invalid_data };

  await requireHousemate(roomId, userId);

  const id = await createDrizzleSupabaseClient(userId).rls(async (tx) => {
    const [event] = await tx
      .insert(hospiEvents)
      .values({
        roomId,
        createdBy: userId,
        title: parsed.data.title,
        description: parsed.data.description || null,
        eventDate: parsed.data.eventDate,
        timeStart: parsed.data.timeStart,
        timeEnd: parsed.data.timeEnd || null,
        location: parsed.data.location || null,
        rsvpDeadline: parsed.data.rsvpDeadline ? new Date(parsed.data.rsvpDeadline) : null,
        maxAttendees: parsed.data.maxAttendees || null,
        notes: parsed.data.notes || null,
      })
      .returning({ id: hospiEvents.id });
    return event.id;
  });

  return { success: true, eventId: id };
}

export async function updateEventForUser(
  userId: string,
  eventId: string,
  roomId: string,
  data: CreateEventData,
) {
  const parsed = createEventSchema.safeParse(data);
  if (!parsed.success) return { error: CommonError.invalid_data };

  await requireHousemate(roomId, userId);

  await createDrizzleSupabaseClient(userId).rls(async (tx) => {
    await tx
      .update(hospiEvents)
      .set({
        title: parsed.data.title,
        description: parsed.data.description || null,
        eventDate: parsed.data.eventDate,
        timeStart: parsed.data.timeStart,
        timeEnd: parsed.data.timeEnd || null,
        location: parsed.data.location || null,
        rsvpDeadline: parsed.data.rsvpDeadline ? new Date(parsed.data.rsvpDeadline) : null,
        maxAttendees: parsed.data.maxAttendees || null,
        notes: parsed.data.notes || null,
        sequence: sql`${hospiEvents.sequence} + 1`,
      })
      .where(and(eq(hospiEvents.id, eventId), eq(hospiEvents.createdBy, userId)));
  });

  return { success: true };
}

export async function cancelEventForUser(userId: string, eventId: string) {
  const result = await createDrizzleSupabaseClient(userId).rls(async (tx) => {
    const [event] = await tx
      .update(hospiEvents)
      .set({ cancelledAt: new Date(), sequence: sql`${hospiEvents.sequence} + 1` })
      .where(and(eq(hospiEvents.id, eventId), eq(hospiEvents.createdBy, userId)))
      .returning({ title: hospiEvents.title });

    if (!event) return null;

    const invitees = await tx
      .select({ userId: hospiInvitations.userId })
      .from(hospiInvitations)
      .where(
        and(
          eq(hospiInvitations.eventId, eventId),
          ne(hospiInvitations.status, InvitationStatus.not_attending),
        ),
      );

    return { eventTitle: event.title, invitees };
  });

  // Notify invitees outside the RLS transaction
  if (result) {
    for (const invitee of result.invitees) {
      await notifyUser(
        invitee.userId,
        "notifications.eventCancelled",
        { eventTitle: result.eventTitle },
        {
          email: {
            template: "eventCancelled",
            props: { eventTitle: result.eventTitle },
          },
        },
      );
    }
  }

  return { success: true };
}

export async function batchInviteApplicantsForUser(
  userId: string,
  eventId: string,
  roomId: string,
  applicationIds: string[],
) {
  await requireHousemate(roomId, userId);

  if (applicationIds.length === 0) return { error: EventError.no_applications };
  if (applicationIds.length > MAX_INVITATIONS_PER_EVENT)
    return { error: EventError.too_many_invitations };

  const invitedCount = await createDrizzleSupabaseClient(userId).rls(async (tx) => {
    const [event] = await tx
      .select({ id: hospiEvents.id, title: hospiEvents.title, roomId: hospiEvents.roomId })
      .from(hospiEvents)
      .where(and(eq(hospiEvents.id, eventId), eq(hospiEvents.roomId, roomId)));
    if (!event) throw new Error("Event not found");

    const [room] = await tx.select({ title: rooms.title }).from(rooms).where(eq(rooms.id, roomId));

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
      await tx
        .insert(hospiInvitations)
        .values({ eventId, userId: app.userId, applicationId: app.id })
        .onConflictDoNothing();

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
          userId,
        );
      }

      const eventUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/applications`;
      await notifyUser(
        app.userId,
        "notifications.invited",
        { eventTitle: event.title, roomTitle: room?.title ?? "" },
        {
          email: {
            template: "eventInvitation",
            props: {
              eventTitle: event.title,
              roomTitle: room?.title ?? "",
              eventUrl,
            },
          },
        },
      );
    }

    return apps.length;
  });

  return { success: true, count: invitedCount };
}

export async function removeInvitationForUser(
  userId: string,
  invitationId: string,
  roomId: string,
) {
  await requireHousemate(roomId, userId);

  const deleted = await createDrizzleSupabaseClient(userId).rls(async (tx) => {
    const [invitation] = await tx
      .select({ eventId: hospiInvitations.eventId })
      .from(hospiInvitations)
      .innerJoin(hospiEvents, eq(hospiEvents.id, hospiInvitations.eventId))
      .where(and(eq(hospiInvitations.id, invitationId), eq(hospiEvents.roomId, roomId)));

    if (!invitation) return false;

    await tx.delete(hospiInvitations).where(eq(hospiInvitations.id, invitationId));
    return true;
  });

  if (!deleted) return { error: CommonError.not_found };

  return { success: true };
}
