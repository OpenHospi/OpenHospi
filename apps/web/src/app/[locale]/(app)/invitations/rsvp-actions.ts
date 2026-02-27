"use server";

import { withRLS } from "@openhospi/database";
import { applications, hospiEvents, hospiInvitations } from "@openhospi/database/schema";
import type { RsvpData } from "@openhospi/database/validators";
import { rsvpSchema } from "@openhospi/database/validators";
import {
  ApplicationStatus,
  InvitationStatus,
  isValidApplicationTransition,
  isValidInvitationTransition,
} from "@openhospi/shared/enums";
import type { InvitationStatus as InvitationStatusType } from "@openhospi/shared/enums";
import { and, eq, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth-server";
import { notifyUser } from "@/lib/notifications";

type RLSTransaction = Parameters<Parameters<typeof withRLS>[1]>[0];

async function tryUpdateApplicationStatus(
  tx: RLSTransaction,
  applicationId: string,
  targetStatus: ApplicationStatus,
) {
  const [app] = await tx
    .select({ status: applications.status })
    .from(applications)
    .where(eq(applications.id, applicationId));

  if (app && isValidApplicationTransition(app.status as ApplicationStatus, targetStatus)) {
    await tx
      .update(applications)
      .set({ status: targetStatus })
      .where(eq(applications.id, applicationId));
  }
}

async function handleApplicationStatusOnRsvp(
  tx: RLSTransaction,
  newStatus: InvitationStatusType,
  applicationId: string,
  userId: string,
  roomId: string,
  invitationId: string,
) {
  if (newStatus === InvitationStatus.attending) {
    await tryUpdateApplicationStatus(tx, applicationId, ApplicationStatus.attending);
    return;
  }

  if (newStatus !== InvitationStatus.not_attending) return;

  // Only set not_attending if no other active attending invitations for this room
  const [otherAttending] = await tx
    .select({ id: hospiInvitations.id })
    .from(hospiInvitations)
    .innerJoin(hospiEvents, eq(hospiEvents.id, hospiInvitations.eventId))
    .where(
      and(
        eq(hospiInvitations.userId, userId),
        eq(hospiEvents.roomId, roomId),
        eq(hospiInvitations.status, InvitationStatus.attending),
        ne(hospiInvitations.id, invitationId),
      ),
    )
    .limit(1);

  if (!otherAttending) {
    await tryUpdateApplicationStatus(tx, applicationId, ApplicationStatus.not_attending);
  }
}

export async function respondToInvitation(invitationId: string, data: RsvpData) {
  const session = await requireSession();
  const parsed = rsvpSchema.safeParse(data);
  if (!parsed.success) return { error: "invalid_data" };

  const result = await withRLS(session.user.id, async (tx) => {
    const [invitation] = await tx
      .select({
        id: hospiInvitations.id,
        eventId: hospiInvitations.eventId,
        userId: hospiInvitations.userId,
        applicationId: hospiInvitations.applicationId,
        status: hospiInvitations.status,
      })
      .from(hospiInvitations)
      .where(eq(hospiInvitations.id, invitationId))
      .for("update");

    if (!invitation || invitation.userId !== session.user.id) {
      return { error: "not_found" };
    }

    const currentStatus = invitation.status as InvitationStatusType;
    const newStatus = parsed.data.status as InvitationStatusType;

    if (!isValidInvitationTransition(currentStatus, newStatus)) {
      return { error: "invalid_transition" };
    }

    const [event] = await tx
      .select({
        id: hospiEvents.id,
        rsvpDeadline: hospiEvents.rsvpDeadline,
        maxAttendees: hospiEvents.maxAttendees,
        cancelledAt: hospiEvents.cancelledAt,
        roomId: hospiEvents.roomId,
        createdBy: hospiEvents.createdBy,
      })
      .from(hospiEvents)
      .where(eq(hospiEvents.id, invitation.eventId));

    if (!event || event.cancelledAt) return { error: "event_cancelled" };
    if (event.rsvpDeadline && new Date() > event.rsvpDeadline) return { error: "deadline_passed" };

    // Check capacity
    if (newStatus === InvitationStatus.attending && event.maxAttendees) {
      const [{ count: attendingCount }] = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(hospiInvitations)
        .where(
          and(
            eq(hospiInvitations.eventId, event.id),
            eq(hospiInvitations.status, InvitationStatus.attending),
          ),
        );
      if (attendingCount >= event.maxAttendees) return { error: "event_full" };
    }

    // Update invitation
    await tx
      .update(hospiInvitations)
      .set({
        status: newStatus,
        respondedAt: new Date(),
        declineReason: parsed.data.declineReason || null,
      })
      .where(eq(hospiInvitations.id, invitationId));

    // Update application status
    if (invitation.applicationId) {
      await handleApplicationStatusOnRsvp(
        tx,
        newStatus,
        invitation.applicationId,
        session.user.id,
        event.roomId,
        invitationId,
      );
    }

    return { success: true, eventCreatorId: event.createdBy };
  });

  if ("error" in result) return result;

  if (result.eventCreatorId) {
    await notifyUser(result.eventCreatorId, "notifications.rsvpReceived", {
      name: session.user.name ?? "",
      status: parsed.data.status,
    });
  }

  revalidatePath("/invitations");
  return { success: true };
}
