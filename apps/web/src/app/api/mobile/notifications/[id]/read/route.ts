import { type NextRequest, NextResponse } from "next/server";

import { requireApiSession, apiError } from "@/app/api/mobile/_lib/auth";
import { markNotificationRead } from "@/lib/queries/notifications";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireApiSession(request);
    const { id } = await params;

    await markNotificationRead(id, session.user.id);

    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof NextResponse) return e;
    return apiError("Internal server error", 500);
  }
}
