import { NextResponse } from "next/server";

import { apiError, requireApiSession } from "@/app/api/mobile/_lib/auth";
import { getOrCreateConversation } from "@/lib/queries/chat";

export async function POST(request: Request) {
  try {
    await requireApiSession(request);
    const { roomId, seekerUserId, memberUserIds } = await request.json();

    if (!roomId || !seekerUserId || !Array.isArray(memberUserIds)) {
      return apiError("Missing required fields", 422);
    }

    const conversation = await getOrCreateConversation(roomId, seekerUserId, memberUserIds);
    return NextResponse.json(conversation);
  } catch (e) {
    if (e instanceof NextResponse) return e;
    throw e;
  }
}
