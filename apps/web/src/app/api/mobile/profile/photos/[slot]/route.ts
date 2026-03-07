import { NextResponse } from "next/server";

import { apiError, requireApiSession } from "@/app/api/mobile/_lib/auth";
import { isRestricted } from "@/lib/auth/server";
import { deleteProfilePhotoForUser } from "@/lib/services/profile-mutations";

export async function DELETE(request: Request, { params }: { params: Promise<{ slot: string }> }) {
  try {
    const session = await requireApiSession(request);
    if (await isRestricted(session.user.id)) {
      return apiError("Processing restricted", 403, "PROCESSING_RESTRICTED");
    }

    const { slot } = await params;
    const slotNum = Number(slot);
    if (slotNum < 1 || slotNum > 5) return apiError("Invalid slot", 400);

    const result = await deleteProfilePhotoForUser(session.user.id, slotNum);
    if ("error" in result && result.error) return apiError(result.error, 422);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof NextResponse) return e;
    throw e;
  }
}
