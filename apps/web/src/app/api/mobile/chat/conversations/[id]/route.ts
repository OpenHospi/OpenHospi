import { NextResponse } from "next/server";

import { apiError, apiSuccess, requireApiSession } from "@/app/api/mobile/_lib/auth";
import { getConversationDetail } from "@/lib/queries/chat";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await requireApiSession(request);
    const { id } = await params;
    const detail = await getConversationDetail(session.user.id, id);
    if (!detail) return apiError("Conversation not found", 404);
    return apiSuccess(detail);
  } catch (e) {
    if (e instanceof NextResponse) return e;
    throw e;
  }
}
