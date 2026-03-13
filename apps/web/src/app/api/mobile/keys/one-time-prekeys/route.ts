import { NextResponse } from "next/server";

import { apiError, apiSuccess, requireApiSession } from "@/app/api/mobile/_lib/auth";
import { getOneTimePreKeyCount, insertOneTimePreKeys } from "@/lib/services/key-mutations";

export async function POST(request: Request) {
  try {
    await requireApiSession(request);
    const body = (await request.json()) as {
      deviceId?: string;
      keys?: { keyId: number; publicKey: string }[];
    };

    if (!body.deviceId) {
      return apiError("deviceId is required", 400);
    }

    if (!Array.isArray(body.keys) || body.keys.length === 0) {
      return apiError("keys must be a non-empty array", 400);
    }

    await insertOneTimePreKeys(body.deviceId, body.keys);

    return apiSuccess({ success: true });
  } catch (e) {
    if (e instanceof NextResponse) return e;
    throw e;
  }
}

export async function GET(request: Request) {
  try {
    await requireApiSession(request);

    const url = new URL(request.url);
    const deviceId = url.searchParams.get("deviceId");

    if (!deviceId) {
      return apiError("deviceId query parameter is required", 400);
    }

    const count = await getOneTimePreKeyCount(deviceId);

    return apiSuccess({ count });
  } catch (e) {
    if (e instanceof NextResponse) return e;
    throw e;
  }
}
