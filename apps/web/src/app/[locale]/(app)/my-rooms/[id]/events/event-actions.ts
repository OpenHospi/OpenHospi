"use server";

import { withRLS } from "@openhospi/database";
import { hospiEvents, hospiInvitations } from "@openhospi/database/schema";
import type { CreateEventData } from "@openhospi/database/validators";
import { createEventSchema } from "@openhospi/database/validators";
import { InvitationStatus } from "@openhospi/shared/enums";
import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { requireHousemate, requireSession } from "@/lib/auth-server";
import { notifyUser } from "@/lib/notifications";

export async function createEvent(roomId: string, data: CreateEventData) {
  const session = await requireSession();
  const parsed = createEventSchema.safeParse(data);
  if (!parsed.success) return { error: "invalid_data" };

  await requireHousemate(roomId, session.user.id);

  const id = await withRLS(session.user.id, async (tx) => {
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
        rsvpDeadline: parsed.data.rsvpDeadline || null,
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
  const parsed = createEventSchema.safeParse(data);
  if (!parsed.success) return { error: "invalid_data" };

  await withRLS(session.user.id, async (tx) => {
    await tx
      .update(hospiEvents)
      .set({
        title: parsed.data.title,
        description: parsed.data.description || null,
        eventDate: parsed.data.eventDate,
        timeStart: parsed.data.timeStart,
        timeEnd: parsed.data.timeEnd || null,
        location: parsed.data.location || null,
        rsvpDeadline: parsed.data.rsvpDeadline || null,
        maxAttendees: parsed.data.maxAttendees || null,
        notes: parsed.data.notes || null,
      })
      .where(and(eq(hospiEvents.id, eventId), eq(hospiEvents.createdBy, session.user.id)));
  });

  revalidatePath(`/my-rooms/${roomId}`);
  revalidatePath(`/my-rooms/${roomId}/events/${eventId}`);
  return { success: true };
}

export async function cancelEvent(eventId: string, roomId: string) {
  const session = await requireSession();

  const result = await withRLS(session.user.id, async (tx) => {
    const [event] = await tx
      .update(hospiEvents)
      .set({ cancelledAt: new Date() })
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
      await notifyUser(invitee.userId, "notifications.eventCancelled", {
        eventTitle: result.eventTitle,
      });
    }
  }

  revalidatePath(`/my-rooms/${roomId}`);
  revalidatePath(`/my-rooms/${roomId}/events/${eventId}`);
  return { success: true };
}
