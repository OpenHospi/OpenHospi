import { NextResponse } from "next/server";

import { apiError, apiSuccess, requireApiSession } from "@/app/api/mobile/_lib/auth";
import { getDevicesForUser } from "@/lib/services/key-mutations";

export async function GET(request: Request) {
  try {
    const session = await requireApiSession(request);

    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return apiError("userId query parameter is required", 400);
    }

    const devices = await getDevicesForUser(session.user.id, userId);

    return apiSuccess(devices);
  } catch (e) {
    if (e instanceof NextResponse) return e;
    throw e;
  }
}
