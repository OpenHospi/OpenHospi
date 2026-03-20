import { CommonError } from "@openhospi/shared/error-codes";
import { NextResponse } from "next/server";

import { apiError, requireApiSession } from "@/app/api/mobile/_lib/auth";
import { isRestricted } from "@/lib/auth/server";
import { saveProfilePhotoForUser } from "@/lib/services/profile-mutations";

export async function POST(request: Request) {
  try {
    const session = await requireApiSession(request);
    if (await isRestricted(session.user.id)) {
      return apiError("Processing restricted", 403, CommonError.processing_restricted);
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const slot = Number(formData.get("slot"));

    if (!file) return apiError("Missing file", 400);
    if (slot < 1 || slot > 5) return apiError("Invalid slot", 400);

    const result = await saveProfilePhotoForUser(session.user.id, file, slot);
    if ("error" in result && result.error) return apiError(result.error, 422);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof NextResponse) return e;
    throw e;
  }
}
