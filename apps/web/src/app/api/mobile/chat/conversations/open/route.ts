import { NextResponse } from "next/server";

import { apiError, apiSuccess, requireApiSession } from "@/app/api/mobile/_lib/auth";
import { getOrCreateHospiConversation } from "@/lib/queries/chat";

export async function POST(request: Request) {
  try {
    const session = await requireApiSession(request);
    const userId = session.user.id;

    const body = (await request.json()) as {
      roomId?: string;
      seekerUserId?: string;
      memberUserIds?: string[];
    };

    if (!body.roomId || !body.seekerUserId || !body.memberUserIds) {
      return apiError("roomId, seekerUserId, and memberUserIds are required", 400);
    }

    if (userId !== body.seekerUserId && !body.memberUserIds.includes(userId)) {
      return apiError("Not authorized to open this chat", 403);
    }

    const allMembers = [...new Set([...body.memberUserIds, body.seekerUserId])];
    const conversationId = await getOrCreateHospiConversation(
      body.roomId,
      body.seekerUserId,
      allMembers,
    );

    return apiSuccess({ conversationId });
  } catch (e) {
    if (e instanceof NextResponse) return e;
    throw e;
  }
}
