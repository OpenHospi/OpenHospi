"use server";

import { InvitationStatus } from "@openhospi/shared/enums";
import type { CreateEventData } from "@openhospi/validators";
import { createEventSchema } from "@openhospi/validators";
import { and, eq, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { requireHousemate, requireNotRestricted, requireSession } from "@/lib/auth/server";
import { createDrizzleSupabaseClient } from "@/lib/db";
import { hospiEvents, hospiInvitations } from "@/lib/db/schema";
import { notifyUser } from "@/lib/queries/notifications";

export async function createEvent(roomId: string, data: CreateEventData) {
  const session = await requireSession();
  const restricted = await requireNotRestricted(session.user.id);
  if (restricted) return restricted;

  const parsed = createEventSchema.safeParse(data);
  if (!parsed.success) return { error: "invalid_data" as const };

  await requireHousemate(roomId, session.user.id);

  const id = await createDrizzleSupabaseClient(session.user.id).rls(async (tx) => {
    const [event] = await tx
      .insert(hospiEvents)
      .values({
        roomId,
        createdBy: session.user.id,
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

  revalidatePath(`/my-rooms/${roomId}`);
  return { success: true, eventId: id };
}

export async function updateEvent(eventId: string, roomId: string, data: CreateEventData) {
  const session = await requireSession();
  const restricted = await requireNotRestricted(session.user.id);
  if (restricted) return restricted;

  const parsed = createEventSchema.safeParse(data);
  if (!parsed.success) return { error: "invalid_data" as const };

  await requireHousemate(roomId, session.user.id);

  await createDrizzleSupabaseClient(session.user.id).rls(async (tx) => {
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
      .where(and(eq(hospiEvents.id, eventId), eq(hospiEvents.createdBy, session.user.id)));
  });

  revalidatePath(`/my-rooms/${roomId}`);
  revalidatePath(`/my-rooms/${roomId}/events/${eventId}`);
  return { success: true };
}

export async function cancelEvent(eventId: string, roomId: string) {
  const session = await requireSession();
  const restricted = await requireNotRestricted(session.user.id);
  if (restricted) return restricted;

  const result = await createDrizzleSupabaseClient(session.user.id).rls(async (tx) => {
    const [event] = await tx
      .update(hospiEvents)
      .set({ cancelledAt: new Date(), sequence: sql`${hospiEvents.sequence} + 1` })
      .where(and(eq(hospiEvents.id, eventId), eq(hospiEvents.createdBy, session.user.id)))
      .returning({ title: hospiEvents.title });

    if (!event) return null;

    // Fetch all invitees who haven't declined
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

  // Notify invitees outside the RLS transaction (same pattern as rsvp-actions)
  if (result) {
    for (const invitee of result.invitees) {
      await notifyUser(
        invitee.userId,
        "notifications.eventCancelled",
        {
          eventTitle: result.eventTitle,
        },
        {
          email: {
            template: "eventCancelled",
            props: { eventTitle: result.eventTitle },
          },
        },
      );
    }
  }

  revalidatePath(`/my-rooms/${roomId}`);
  revalidatePath(`/my-rooms/${roomId}/events/${eventId}`);
  return { success: true };
}
