"use server";

import type { CreateEventData } from "@openhospi/validators";
import { revalidatePath } from "next/cache";

import { requireNotRestricted, requireSession } from "@/lib/auth/server";
import {
  cancelEventForUser,
  createEventForUser,
  updateEventForUser,
} from "@/lib/services/event-mutations";

export async function createEvent(roomId: string, data: CreateEventData) {
  const session = await requireSession();
  const restricted = await requireNotRestricted(session.user.id);
  if (restricted) return restricted;

  const result = await createEventForUser(session.user.id, roomId, data);
  revalidatePath(`/my-rooms/${roomId}`);
  return result;
}

export async function updateEvent(eventId: string, roomId: string, data: CreateEventData) {
  const session = await requireSession();
  const restricted = await requireNotRestricted(session.user.id);
  if (restricted) return restricted;

  const result = await updateEventForUser(session.user.id, eventId, roomId, data);
  revalidatePath(`/my-rooms/${roomId}`);
  revalidatePath(`/my-rooms/${roomId}/events/${eventId}`);
  return result;
}

export async function cancelEvent(eventId: string, roomId: string) {
  const session = await requireSession();
  const restricted = await requireNotRestricted(session.user.id);
  if (restricted) return restricted;

  const result = await cancelEventForUser(session.user.id, eventId);
  revalidatePath(`/my-rooms/${roomId}`);
  revalidatePath(`/my-rooms/${roomId}/events/${eventId}`);
  return result;
}
