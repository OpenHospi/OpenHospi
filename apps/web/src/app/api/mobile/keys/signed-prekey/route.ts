import { NextResponse } from "next/server";

import { apiError, apiSuccess, requireApiSession } from "@/app/api/mobile/_lib/auth";
import { insertSignedPreKey } from "@/lib/services/key-mutations";

export async function POST(request: Request) {
  try {
    const session = await requireApiSession(request);
    const body = (await request.json()) as {
      keyId?: number;
      publicKey?: string;
      signature?: string;
    };

    if (body.keyId == null || !body.publicKey || !body.signature) {
      return apiError("keyId, publicKey, and signature are required", 400);
    }

    await insertSignedPreKey(session.user.id, {
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
