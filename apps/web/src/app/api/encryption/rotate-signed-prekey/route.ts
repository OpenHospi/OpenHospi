import { NextResponse } from "next/server";

import { apiError, apiSuccess, requireApiSession } from "@/app/api/mobile/_lib/auth";
import { insertSignedPreKey } from "@/lib/services/key-mutations";

/**
 * POST /api/encryption/rotate-signed-prekey
 *
 * Upload a new signed prekey for a device.
 * Called during periodic key rotation (every 7-30 days).
 */
export async function POST(request: Request) {
  try {
    await requireApiSession(request);
    const body = (await request.json()) as {
      deviceUuid?: string;
      keyId?: number;
      publicKey?: string;
      signature?: string;
    };

    if (!body.deviceUuid || body.keyId == null || !body.publicKey || !body.signature) {
      return apiError("deviceUuid, keyId, publicKey, and signature are required", 400);
    }

    await insertSignedPreKey(body.deviceUuid, {
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
