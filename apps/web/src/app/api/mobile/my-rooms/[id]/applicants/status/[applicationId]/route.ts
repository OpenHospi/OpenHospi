import { NextResponse } from "next/server";

import { apiError, requireApiSession } from "@/app/api/mobile/_lib/auth";
import { isRestricted } from "@/lib/auth/server";
import { updateApplicationStatusForUser } from "@/lib/services/applicant-owner-mutations";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; applicationId: string }> },
) {
  try {
    const session = await requireApiSession(request);
    if (await isRestricted(session.user.id)) {
      return apiError("Processing restricted", 403, "PROCESSING_RESTRICTED");
    }

    const { id, applicationId } = await params;
    const { status } = (await request.json()) as { status: string };
    const result = await updateApplicationStatusForUser(
      session.user.id,
      id,
      applicationId,
      status as never,
    );
    if ("error" in result) return apiError(result.error, 422);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof NextResponse) return e;
    return apiError("Internal server error", 500);
  }
}
