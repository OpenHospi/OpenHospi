import { NextResponse } from "next/server";

import { apiError, requireApiSession } from "@/app/api/mobile/_lib/auth";
import { getApplicationForRoom, getRoomDetailForApply } from "@/lib/queries/applications";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireApiSession(request);
    const { id } = await params;

    const [room, application] = await Promise.all([
      getRoomDetailForApply(id, session.user.id),
      getApplicationForRoom(id, session.user.id),
    ]);

    if (!room) return apiError("Room not found", 404);

    return NextResponse.json({ room, application });
  } catch (e) {
    if (e instanceof NextResponse) return e;
    throw e;
  }
}
