import { NextResponse } from "next/server";

import { apiError, apiSuccess, requireApiSession } from "@/app/api/mobile/_lib/auth";
import { getIdentityKeysByUserIds } from "@/lib/services/key-mutations";

export async function POST(request: Request) {
  try {
    const session = await requireApiSession(request);
    const body = (await request.json()) as { userIds?: string[] };

    if (!Array.isArray(body.userIds) || body.userIds.length === 0 || body.userIds.length > 50) {
      return apiError("userIds must be a non-empty array of up to 50 items", 400);
    }

    const keys = await getIdentityKeysByUserIds(session.user.id, body.userIds);
    return apiSuccess(keys);
  } catch (e) {
    if (e instanceof NextResponse) return e;
    throw e;
  }
}
