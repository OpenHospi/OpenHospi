import { NextResponse } from "next/server";

import { apiError, apiSuccess, requireApiSession } from "@/app/api/mobile/_lib/auth";
import { registerDevice } from "@/lib/services/key-mutations";

export async function POST(request: Request) {
  try {
    const session = await requireApiSession(request);
    const body = (await request.json()) as {
      deviceId?: number;
      registrationId?: number;
      identityKeyPublic?: string;
      platform?: "web" | "ios" | "android";
      pushToken?: string;
    };

    if (
      body.deviceId == null ||
      body.registrationId == null ||
      !body.identityKeyPublic ||
      !body.platform
    ) {
      return apiError(
        "deviceId, registrationId, identityKeyPublic, and platform are required",
        400,
      );
    }

    const device = await registerDevice(session.user.id, {
      deviceId: body.deviceId,
      registrationId: body.registrationId,
      identityKeyPublic: body.identityKeyPublic,
      platform: body.platform,
      pushToken: body.pushToken,
    });

    return apiSuccess(device);
  } catch (e) {
    if (e instanceof NextResponse) return e;
    throw e;
  }
}
