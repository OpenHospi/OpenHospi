import { NextResponse } from "next/server";

import { requireApiSession } from "@/app/api/mobile/_lib/auth";
import { storeSenderKeyDistribution } from "@/lib/services/key-mutations";

export async function POST(request: Request) {
  try {
    const session = await requireApiSession(request);
    const { conversationId, senderDeviceId, recipientDeviceId, ciphertext } = await request.json();

    if (!conversationId || !senderDeviceId || !recipientDeviceId || !ciphertext) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 422 });
    }

    const row = await storeSenderKeyDistribution({
      conversationId,
      senderUserId: session.user.id,
      senderDeviceId,
      recipientDeviceId,
      ciphertext,
    });

    return NextResponse.json(row);
  } catch (e) {
    if (e instanceof NextResponse) return e;
    throw e;
  }
}
