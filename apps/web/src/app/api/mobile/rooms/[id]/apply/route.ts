import { CommonError } from "@openhospi/shared/error-codes";
import { NextResponse } from "next/server";

import { apiError, requireApiSession } from "@/app/api/mobile/_lib/auth";
import { isRestricted } from "@/lib/auth/server";
import { applyToRoomForUser } from "@/lib/services/application-mutations";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireApiSession(request);
    if (await isRestricted(session.user.id)) {
      return apiError("Processing restricted", 403, CommonError.processing_restricted);
    }

    const { id } = await params;
    const data = await request.json();
    const result = await applyToRoomForUser(session.user.id, id, data);
    if ("error" in result && result.error) {
      const status = result.error === CommonError.rate_limited ? 429 : 422;
      return apiError(result.error, status);
    }
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof NextResponse) return e;
    throw e;
  }
}
