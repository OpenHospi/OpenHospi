import { createDrizzleSupabaseClient } from "@openhospi/database";
import {
  applications,
  hospiEvents,
  hospiInvitations,
  houseMembers,
  rooms,
} from "@openhospi/database/schema";
import { InvitationStatus, isValidInvitationTransition } from "@openhospi/shared/enums";
import { CommonError } from "@openhospi/shared/error-codes";
import { rsvpSchema } from "@openhospi/validators";
import { and, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import { apiError, requireApiSession } from "@/app/api/mobile/_lib/auth";
import { isRestricted } from "@/lib/auth/server";
import { notifyUser } from "@/lib/queries/notifications";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireApiSession(request);
    if (await isRestricted(session.user.id)) {
      return apiError("Processing restricted", 403, CommonError.processing_restricted);
    }

    const { id: invitationId } = await params;
    const data = await request.json();

    const parsed = rsvpSchema.safeParse(data);
    if (!parsed.success) return apiError("Invalid data", 422);

    const result = await createDrizzleSupabaseClient(session.user.id).rls(async (tx) => {
      const [invitation] = await tx
        .select({
          id: hospiInvitations.id,
          eventId: hospiInvitations.eventId,
          userId: hospiInvitations.userId,
          status: hospiInvitations.status,
        })
        .from(hospiInvitations)
        .where(eq(hospiInvitations.id, invitationId))
        .for("update");

      if (!invitation || invitation.userId !== session.user.id) {
        return { error: "not_found" as const };
      }

      const currentStatus = invitation.status as InvitationStatus;
      const newStatus = parsed.data.status as InvitationStatus;

      if (!isValidInvitationTransition(currentStatus, newStatus)) {
        return { error: "invalid_transition" as const };
      }

      const [event] = await tx
        .select({
          id: hospiEvents.id,
          rsvpDeadline: hospiEvents.rsvpDeadline,
          maxAttendees: hospiEvents.maxAttendees,
          cancelledAt: hospiEvents.cancelledAt,
          createdBy: hospiEvents.createdBy,
        })
        .from(hospiEvents)
        .where(eq(hospiEvents.id, invitation.eventId));

      if (!event || event.cancelledAt) return { error: "event_cancelled" as const };
      if (event.rsvpDeadline && new Date() > event.rsvpDeadline)
        return { error: "deadline_passed" as const };

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
        if (attendingCount >= event.maxAttendees) return { error: "event_full" as const };
      }

      await tx
        .update(hospiInvitations)
        .set({
          status: newStatus,
          respondedAt: new Date(),
          declineReason: parsed.data.declineReason || null,
        })
        .where(eq(hospiInvitations.id, invitationId));

      if (newStatus === InvitationStatus.attending || newStatus === InvitationStatus.maybe) {
        const [inv] = await tx
          .select({ applicationId: hospiInvitations.applicationId })
          .from(hospiInvitations)
          .where(eq(hospiInvitations.id, invitationId));

        if (inv?.applicationId) {
          const [app] = await tx
            .select({ roomId: applications.roomId })
            .from(applications)
            .where(eq(applications.id, inv.applicationId));
          const [room] = await tx
            .select({ houseId: rooms.houseId })
            .from(rooms)
            .where(eq(rooms.id, app.roomId));
          const members = await tx
            .select({ userId: houseMembers.userId })
            .from(houseMembers)
            .where(eq(houseMembers.houseId, room.houseId));

          return {
            success: true,
            eventCreatorId: event.createdBy,
            roomId: app.roomId,
            memberIds: members.map((m) => m.userId),
          };
        }
      }

      return { success: true, eventCreatorId: event.createdBy };
    });

    if ("error" in result && result.error) return apiError(result.error, 422);

    if (result.eventCreatorId) {
      const eventUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/my-rooms`;
      await notifyUser(
        result.eventCreatorId,
        "notifications.rsvpReceived",
        {
          name: session.user.name ?? "",
          status: parsed.data.status,
        },
        {
          email: {
            template: "rsvpReceived",
            props: {
              name: session.user.name ?? "",
              status: parsed.data.status,
              eventUrl,
            },
          },
        },
      );
    }

    return NextResponse.json<{ success: true }>({ success: true });
  } catch (e) {
    if (e instanceof NextResponse) return e;
    throw e;
  }
}
