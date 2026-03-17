import { NextResponse } from "next/server";

import { apiError, apiSuccess, requireApiSession } from "@/app/api/mobile/_lib/auth";
import {
  registerDevice,
  insertSignedPreKey,
  insertOneTimePreKeys,
} from "@/lib/services/key-mutations";

/**
 * POST /api/encryption/register-device
 *
 * Unified device registration: registers the device AND uploads
 * signed prekey + one-time prekeys in a single call.
 *
 * The server assigns the per-user `deviceId` automatically by
 * finding the next available integer for this user.
 */
export async function POST(request: Request) {
  try {
    const session = await requireApiSession(request);
    const body = (await request.json()) as {
      registrationId?: number;
      identityKeyPublic?: string;
      platform?: "web" | "ios" | "android";
      pushToken?: string;
      signedPreKey?: { keyId: number; publicKey: string; signature: string };
      oneTimePreKeys?: { keyId: number; publicKey: string }[];
    };

    if (body.registrationId == null || !body.identityKeyPublic || !body.platform) {
      return apiError("registrationId, identityKeyPublic, and platform are required", 400);
    }

    if (!body.signedPreKey) {
      return apiError("signedPreKey is required", 400);
    }

    if (!Array.isArray(body.oneTimePreKeys) || body.oneTimePreKeys.length === 0) {
      return apiError("oneTimePreKeys must be a non-empty array", 400);
    }

    // Register device — server assigns deviceId (always 1 for now, will support
    // multi-device in Phase 7 by computing next available deviceId per user)
    const device = await registerDevice(session.user.id, {
      deviceId: 1,
      registrationId: body.registrationId,
      identityKeyPublic: body.identityKeyPublic,
      platform: body.platform,
      pushToken: body.pushToken,
    });

    // Store signed prekey for this device
    await insertSignedPreKey(device.id, body.signedPreKey);

    // Store one-time prekeys for this device
    await insertOneTimePreKeys(device.id, body.oneTimePreKeys);

    return apiSuccess({
      id: device.id,
      deviceId: device.deviceId,
      userId: device.userId,
    });
  } catch (e) {
    if (e instanceof NextResponse) return e;
    throw e;
  }
}
