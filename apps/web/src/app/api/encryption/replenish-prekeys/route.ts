import { NextResponse } from "next/server";

import { apiError, apiSuccess, requireApiSession } from "@/app/api/mobile/_lib/auth";
import { insertOneTimePreKeys } from "@/lib/services/key-mutations";

/**
 * POST /api/encryption/replenish-prekeys
 *
 * Upload new one-time prekeys for a device.
 * Called when the prekey count drops below threshold.
 */
export async function POST(request: Request) {
  try {
    await requireApiSession(request);
    const body = (await request.json()) as {
      deviceUuid?: string;
      keys?: { keyId: number; publicKey: string }[];
    };

    if (!body.deviceUuid) {
      return apiError("deviceUuid is required", 400);
    }

    if (!Array.isArray(body.keys) || body.keys.length === 0) {
      return apiError("keys must be a non-empty array", 400);
    }

    await insertOneTimePreKeys(body.deviceUuid, body.keys);

    return apiSuccess({ success: true });
  } catch (e) {
    if (e instanceof NextResponse) return e;
    throw e;
  }
}
