import { CommonError } from "@openhospi/shared/error-codes";
import { NextResponse } from "next/server";

import { apiError, requireApiSession } from "@/app/api/mobile/_lib/auth";
import { isRestricted } from "@/lib/auth/server";
import { submitReviewForUser } from "@/lib/services/applicant-owner-mutations";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; applicantUserId: string }> },
) {
  try {
    const session = await requireApiSession(request);
    if (await isRestricted(session.user.id)) {
      return apiError("Processing restricted", 403, CommonError.processing_restricted);
    }

    const { id, applicantUserId } = await params;
    const data = await request.json();
    const result = await submitReviewForUser(session.user.id, id, applicantUserId, data);
    if ("error" in result) return apiError(result.error, 422);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof NextResponse) return e;
    return apiError("Internal server error", 500);
  }
}
