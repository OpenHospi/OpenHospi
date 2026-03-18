import { NextResponse } from "next/server";

import { requireApiSession } from "@/app/api/mobile/_lib/auth";
import { fetchPreKeyBundle } from "@/lib/services/key-mutations";

export async function GET(request: Request, { params }: { params: Promise<{ deviceId: string }> }) {
  try {
    await requireApiSession(request);
    const { deviceId } = await params;

    const bundle = await fetchPreKeyBundle(deviceId);
    if (!bundle) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 });
    }

    return NextResponse.json(bundle);
  } catch (e) {
    if (e instanceof NextResponse) return e;
    throw e;
  }
}
