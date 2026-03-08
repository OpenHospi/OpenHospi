import { withRLS } from "@openhospi/database";
import { hospiEvents, hospiInvitations } from "@openhospi/database/schema";
import { rsvpSchema } from "@openhospi/database/validators";
import { InvitationStatus, isValidInvitationTransition } from "@openhospi/shared/enums";
import { and, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import { apiError, requireApiSession } from "@/app/api/mobile/_lib/auth";
import { isRestricted } from "@/lib/auth/server";
import { notifyUser } from "@/lib/queries/notifications";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireApiSession(request);
    if (await isRestricted(session.user.id)) {
      return apiError("Processing restricted", 403, "PROCESSING_RESTRICTED");
    }

    const { id: invitationId } = await params;
    const data = await request.json();

    const parsed = rsvpSchema.safeParse(data);
    if (!parsed.success) return apiError("Invalid data", 422);

    const result = await withRLS(session.user.id, async (tx) => {
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

    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof NextResponse) return e;
    throw e;
  }
}
