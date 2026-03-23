"use server";

import { revalidatePath } from "next/cache";

import { requireNotRestricted, requireSession } from "@/lib/auth/server";
import {
  batchInviteApplicantsForUser,
  removeInvitationForUser,
} from "@/lib/services/event-mutations";

export async function batchInviteApplicants(
  eventId: string,
  roomId: string,
  applicationIds: string[],
) {
  const session = await requireSession();
  const restricted = await requireNotRestricted(session.user.id);
  if (restricted) return restricted;

  const result = await batchInviteApplicantsForUser(
    session.user.id,
    eventId,
    roomId,
    applicationIds,
  );
  revalidatePath(`/my-rooms/${roomId}`);
  revalidatePath(`/my-rooms/${roomId}/events/${eventId}`);
  return result;
}

export async function removeInvitation(invitationId: string, roomId: string) {
  const session = await requireSession();
  const restricted = await requireNotRestricted(session.user.id);
  if (restricted) return restricted;

  const result = await removeInvitationForUser(session.user.id, invitationId, roomId);
  revalidatePath(`/my-rooms/${roomId}`);
  return result;
}
