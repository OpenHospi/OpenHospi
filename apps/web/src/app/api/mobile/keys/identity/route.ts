import { NextResponse } from "next/server";

import { apiError, apiSuccess, requireApiSession } from "@/app/api/mobile/_lib/auth";
import { upsertIdentityKey } from "@/lib/services/key-mutations";

export async function POST(request: Request) {
  try {
    const session = await requireApiSession(request);
    const body = (await request.json()) as {
      identityPublicKey?: string;
      signingPublicKey?: string;
    };

    if (!body.identityPublicKey || !body.signingPublicKey) {
      return apiError("identityPublicKey and signingPublicKey are required", 400);
    }

    await upsertIdentityKey(session.user.id, body.identityPublicKey, body.signingPublicKey);

    return apiSuccess({ success: true });
  } catch (e) {
    if (e instanceof NextResponse) return e;
    throw e;
  }
}
