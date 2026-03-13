import { NextResponse } from "next/server";

import { apiError, apiSuccess, requireApiSession } from "@/app/api/mobile/_lib/auth";
import { insertSignedPreKey } from "@/lib/services/key-mutations";

export async function POST(request: Request) {
  try {
    await requireApiSession(request);
    const body = (await request.json()) as {
      deviceId?: string;
      keyId?: number;
      publicKey?: string;
      signature?: string;
    };

    if (!body.deviceId || body.keyId == null || !body.publicKey || !body.signature) {
      return apiError("deviceId, keyId, publicKey, and signature are required", 400);
    }

    await insertSignedPreKey(body.deviceId, {
      keyId: body.keyId,
      publicKey: body.publicKey,
      signature: body.signature,
    });

    return apiSuccess({ success: true });
  } catch (e) {
    if (e instanceof NextResponse) return e;
    throw e;
  }
}
