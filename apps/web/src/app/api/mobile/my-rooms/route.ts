import { NextResponse } from "next/server";

import { apiError, requireApiSession } from "@/app/api/mobile/_lib/auth";
import { getUserRooms } from "@/lib/queries/rooms";

export async function GET(request: Request) {
  try {
    const session = await requireApiSession(request);
    const rooms = await getUserRooms(session.user.id);
    return NextResponse.json({ rooms });
  } catch (e) {
    if (e instanceof NextResponse) return e;
    return apiError("Internal server error", 500);
  }
}
