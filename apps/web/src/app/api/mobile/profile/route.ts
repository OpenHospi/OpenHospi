import { CommonError } from "@openhospi/shared/error-codes";
import { NextResponse } from "next/server";

import { apiError, requireApiSession } from "@/app/api/mobile/_lib/auth";
import { isRestricted } from "@/lib/auth/server";
import { getProfile } from "@/lib/queries/profile";
import { updateProfileForUser } from "@/lib/services/profile-mutations";

export async function GET(request: Request) {
  try {
    const session = await requireApiSession(request);
    const profile = await getProfile(session.user.id);
    if (!profile) return apiError("Profile not found", 404);
    return NextResponse.json(profile);
  } catch (e) {
    if (e instanceof NextResponse) return e;
    throw e;
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireApiSession(request);
    if (await isRestricted(session.user.id)) {
      return apiError("Processing restricted", 403, CommonError.processing_restricted);
    }
    const data = await request.json();
    const result = await updateProfileForUser(session.user.id, data);
    if ("error" in result && result.error) return apiError(result.error, 422);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof NextResponse) return e;
    throw e;
  }
}
