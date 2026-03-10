import { NextResponse } from "next/server";

import { apiError, apiSuccess, requireApiSession } from "@/app/api/mobile/_lib/auth";
import { getPreKeyBundle } from "@/lib/services/key-mutations";

export async function GET(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    await requireApiSession(request);
    const { userId } = await params;

    const bundle = await getPreKeyBundle(userId);

    if (!bundle) {
      return apiError("Pre-key bundle not found for this user", 404);
    }

    return apiSuccess(bundle);
  } catch (e) {
    if (e instanceof NextResponse) return e;
    throw e;
  }
}
