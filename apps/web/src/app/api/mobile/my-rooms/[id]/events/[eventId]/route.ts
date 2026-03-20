import { CommonError } from "@openhospi/shared/error-codes";
import { NextResponse } from "next/server";

import { apiError, requireApiSession } from "@/app/api/mobile/_lib/auth";
import { isRestricted } from "@/lib/auth/server";
import { getEventDetail } from "@/lib/queries/events";
import { updateEventForUser } from "@/lib/services/event-mutations";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; eventId: string }> },
) {
  try {
    const session = await requireApiSession(request);
    const { eventId } = await params;
    const event = await getEventDetail(eventId, session.user.id);
    if (!event) return apiError("Event not found", 404);

    return NextResponse.json({
      event: {
        ...event,
        cancelledAt: event.cancelledAt?.toISOString() ?? null,
        createdAt: event.createdAt.toISOString(),
        rsvpDeadline: event.rsvpDeadline?.toISOString() ?? null,
        invitees: event.invitees.map((inv) => ({
          ...inv,
          respondedAt: inv.respondedAt?.toISOString() ?? null,
        })),
      },
    });
  } catch (e) {
    if (e instanceof NextResponse) return e;
    return apiError("Internal server error", 500);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; eventId: string }> },
) {
  try {
    const session = await requireApiSession(request);
    if (await isRestricted(session.user.id)) {
      return apiError("Processing restricted", 403, CommonError.processing_restricted);
    }

    const { id, eventId } = await params;
    const data = await request.json();
    const result = await updateEventForUser(session.user.id, eventId, id, data);
    if ("error" in result) return apiError(result.error, 422);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof NextResponse) return e;
    return apiError("Internal server error", 500);
  }
}
