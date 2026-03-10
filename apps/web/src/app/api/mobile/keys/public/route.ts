import { NextResponse } from "next/server";

import { apiError, requireApiSession } from "@/app/api/mobile/_lib/auth";
import { upsertPublicKey } from "@/lib/services/key-mutations";

export async function POST(request: Request) {
  try {
    const session = await requireApiSession(request);
    const body = (await request.json()) as { publicKeyJwk?: JsonWebKey };

    if (!body.publicKeyJwk) {
      return apiError("publicKeyJwk is required", 400);
    }

    await upsertPublicKey(session.user.id, body.publicKeyJwk);
    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof NextResponse) return e;
    throw e;
  }
}
