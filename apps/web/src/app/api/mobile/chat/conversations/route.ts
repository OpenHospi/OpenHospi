import { NextResponse } from "next/server";

import { requireApiSession } from "@/app/api/mobile/_lib/auth";
import { getConversations } from "@/lib/queries/chat";

export async function GET(request: Request) {
  try {
    const session = await requireApiSession(request);
    const conversations = await getConversations(session.user.id);
    return NextResponse.json(conversations);
  } catch (e) {
    if (e instanceof NextResponse) return e;
    throw e;
  }
}
