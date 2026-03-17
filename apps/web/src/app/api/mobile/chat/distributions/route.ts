import { NextResponse } from "next/server";

import { requireApiSession } from "@/app/api/mobile/_lib/auth";
import { fetchPendingDistributions } from "@/lib/services/key-mutations";

export async function GET(request: Request) {
  try {
    await requireApiSession(request);
    const { searchParams } = new URL(request.url);
    const recipientDeviceId = searchParams.get("recipientDeviceId");

    if (!recipientDeviceId) {
      return NextResponse.json({ error: "Missing recipientDeviceId" }, { status: 422 });
    }

    const pending = await fetchPendingDistributions(recipientDeviceId);
    return NextResponse.json(pending);
  } catch (e) {
    if (e instanceof NextResponse) return e;
    throw e;
  }
}
