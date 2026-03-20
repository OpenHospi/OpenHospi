import { NextResponse } from "next/server";

import { apiError, requireApiSession } from "@/app/api/mobile/_lib/auth";
import { isRestricted } from "@/lib/auth/server";
import { deleteRoomPhotoForUser } from "@/lib/services/room-mutations";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; slot: string }> },
) {
  try {
    const session = await requireApiSession(request);
    if (await isRestricted(session.user.id)) {
      return apiError("Processing restricted", 403, "PROCESSING_RESTRICTED");
    }

    const { id, slot } = await params;
    const result = await deleteRoomPhotoForUser(session.user.id, id, Number(slot));
    if ("error" in result) return apiError(result.error, 422);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof NextResponse) return e;
    return apiError("Internal server error", 500);
  }
}
