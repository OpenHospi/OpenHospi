import { NextResponse } from "next/server";

import { requireApiSession } from "@/app/api/mobile/_lib/auth";
import { registerDevice } from "@/lib/services/key-mutations";

export async function POST(request: Request) {
  try {
    const session = await requireApiSession(request);
    const body = await request.json();

    if (
      !body.registrationId ||
      !body.identityKeyPublic ||
      !body.signingKeyPublic ||
      !body.platform
    ) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 422 });
    }

    if (
      !body.signedPreKey?.keyId ||
      !body.signedPreKey?.publicKey ||
      !body.signedPreKey?.signature
    ) {
      return NextResponse.json({ error: "Missing signed pre-key" }, { status: 422 });
    }

    const device = await registerDevice({
      userId: session.user.id,
      registrationId: body.registrationId,
      identityKeyPublic: body.identityKeyPublic,
      signingKeyPublic: body.signingKeyPublic,
      platform: body.platform,
      signedPreKey: body.signedPreKey,
      oneTimePreKeys: body.oneTimePreKeys ?? [],
    });

    return NextResponse.json(device, { status: 201 });
  } catch (e) {
    if (e instanceof NextResponse) return e;
    throw e;
  }
}
