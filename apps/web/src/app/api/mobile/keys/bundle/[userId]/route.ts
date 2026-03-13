import { NextResponse } from "next/server";

import { apiError, apiSuccess, requireApiSession } from "@/app/api/mobile/_lib/auth";
import { getPreKeyBundle } from "@/lib/services/key-mutations";

export async function GET(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    await requireApiSession(request);

    // userId param is now the device UUID
    const { userId: deviceUuid } = await params;

    const bundle = await getPreKeyBundle(deviceUuid);

    if (!bundle) {
      return apiError("Pre-key bundle not found for this device", 404);
    }

    return apiSuccess(bundle);
  } catch (e) {
    if (e instanceof NextResponse) return e;
    throw e;
  }
}
