import { NextResponse } from "next/server";

import { apiError, apiSuccess, requireApiSession } from "@/app/api/mobile/_lib/auth";
import { getOneTimePreKeyCount, insertOneTimePreKeys } from "@/lib/services/key-mutations";

export async function POST(request: Request) {
  try {
    const session = await requireApiSession(request);
    const body = (await request.json()) as {
      keys?: { keyId: number; publicKey: string }[];
    };

    if (!Array.isArray(body.keys) || body.keys.length === 0) {
      return apiError("keys must be a non-empty array", 400);
    }

    await insertOneTimePreKeys(session.user.id, body.keys);

    return apiSuccess({ success: true });
  } catch (e) {
    if (e instanceof NextResponse) return e;
    throw e;
  }
}

export async function GET(request: Request) {
  try {
    const session = await requireApiSession(request);
    const count = await getOneTimePreKeyCount(session.user.id);

    return apiSuccess({ count });
  } catch (e) {
    if (e instanceof NextResponse) return e;
    throw e;
  }
}
