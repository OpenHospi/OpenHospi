import { NextResponse } from "next/server";

import { apiError, requireApiSession } from "@/app/api/mobile/_lib/auth";
import { isRestricted } from "@/lib/auth/server";
import { createDraftForHouse } from "@/lib/services/room-mutations";

export async function POST(request: Request, { params }: { params: Promise<{ houseId: string }> }) {
  try {
    const session = await requireApiSession(request);
    if (await isRestricted(session.user.id)) {
      return apiError("Processing restricted", 403, "PROCESSING_RESTRICTED");
    }

    const { houseId } = await params;
    const result = await createDraftForHouse(session.user.id, houseId);
    if ("error" in result) {
      const status = result.error === "RATE_LIMITED" ? 429 : 422;
      return apiError(result.error, status);
    }
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    if (e instanceof NextResponse) return e;
    return apiError("Internal server error", 500);
  }
}
