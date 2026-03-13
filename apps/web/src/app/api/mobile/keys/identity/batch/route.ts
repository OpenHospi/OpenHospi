import { NextResponse } from "next/server";

import { apiError, apiSuccess, requireApiSession } from "@/app/api/mobile/_lib/auth";
import { getDevicesForUser } from "@/lib/services/key-mutations";

export async function POST(request: Request) {
  try {
    const session = await requireApiSession(request);
    const body = (await request.json()) as { targetUserId?: string };

    if (!body.targetUserId) {
      return apiError("targetUserId is required", 400);
    }

    const userDevices = await getDevicesForUser(session.user.id, body.targetUserId);
    return apiSuccess(userDevices);
  } catch (e) {
    if (e instanceof NextResponse) return e;
    throw e;
  }
}
