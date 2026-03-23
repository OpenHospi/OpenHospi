import { CommonError } from "@openhospi/shared/error-codes";
import { NextResponse } from "next/server";

import { apiError, hasError, requireApiSession } from "@/app/api/mobile/_lib/auth";
import { isRestricted } from "@/lib/auth/server";
import { getRoomEvents } from "@/lib/queries/events";
import { createEventForUser } from "@/lib/services/event-mutations";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireApiSession(request);
    const { id } = await params;
    const events = await getRoomEvents(id, session.user.id);

    return NextResponse.json({
      events: events.map((e) => ({
        ...e,
        cancelledAt: e.cancelledAt?.toISOString() ?? null,
        createdAt: e.createdAt.toISOString(),
      })),
    });
  } catch (e) {
    if (e instanceof NextResponse) return e;
    return apiError("Internal server error", 500);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireApiSession(request);
    if (await isRestricted(session.user.id)) {
      return apiError("Processing restricted", 403, CommonError.processing_restricted);
    }

    const { id } = await params;
    const data = await request.json();
    const result = await createEventForUser(session.user.id, id, data);
    if (hasError(result)) return apiError(result.error, 422);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof NextResponse) return e;
    return apiError("Internal server error", 500);
  }
}
