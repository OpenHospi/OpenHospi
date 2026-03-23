import { CommonError } from "@openhospi/shared/error-codes";
import { NextResponse } from "next/server";

import { apiError, hasError, requireApiSession } from "@/app/api/mobile/_lib/auth";
import { isRestricted } from "@/lib/auth/server";
import { saveRoomDetails } from "@/lib/services/room-mutations";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireApiSession(request);
    if (await isRestricted(session.user.id)) {
      return apiError("Processing restricted", 403, CommonError.processing_restricted);
    }

    const { id } = await params;
    const data = await request.json();
    const result = await saveRoomDetails(session.user.id, id, data);
    if (hasError(result)) return apiError(result.error, 422);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof NextResponse) return e;
    return apiError("Internal server error", 500);
  }
}
