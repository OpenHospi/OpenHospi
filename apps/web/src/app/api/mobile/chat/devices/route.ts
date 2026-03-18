import { NextResponse } from "next/server";

import { requireApiSession } from "@/app/api/mobile/_lib/auth";
import { getDevicesForUser } from "@/lib/services/key-mutations";

export async function GET(request: Request) {
  try {
    await requireApiSession(request);
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 422 });
    }

    const deviceList = await getDevicesForUser(userId);
    return NextResponse.json(deviceList);
  } catch (e) {
    if (e instanceof NextResponse) return e;
    throw e;
  }
}
