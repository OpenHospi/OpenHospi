import { NextResponse } from "next/server";

import { apiError, requireApiSession } from "@/app/api/mobile/_lib/auth";
import { reorderProfilePhotosForUser } from "@/lib/services/profile-mutations";

export async function PATCH(request: Request) {
  try {
    const session = await requireApiSession(request);
    const { order } = await request.json();

    if (!Array.isArray(order) || order.length === 0) {
      return apiError("Invalid order", 422);
    }

    const result = await reorderProfilePhotosForUser(session.user.id, order);
    if ("error" in result && result.error) return apiError(result.error, 422);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof NextResponse) return e;
    throw e;
  }
}
