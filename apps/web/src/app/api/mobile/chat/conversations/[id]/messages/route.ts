import { db } from "@openhospi/database";
import { messages } from "@openhospi/database/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { apiSuccess, requireApiSession } from "@/app/api/mobile/_lib/auth";
import { getMessages } from "@/lib/queries/chat";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await requireApiSession(request);
    const { id: conversationId } = await params;

    const url = new URL(request.url);

    // If messageId is provided, return just the metadata for that message
    // (used by realtime handler to get sender info)
    const messageId = url.searchParams.get("messageId");
    if (messageId) {
      const [msg] = await db
        .select({
          senderId: messages.senderId,
          createdAt: messages.createdAt,
        })
        .from(messages)
        .where(eq(messages.id, messageId));

      if (!msg) return apiSuccess(null);
      return apiSuccess({ senderId: msg.senderId, createdAt: msg.createdAt });
    }

    // Otherwise, return paginated messages
    const cursorParam = url.searchParams.get("cursor");
    const cursor = cursorParam ? new Date(cursorParam) : undefined;
    const msgs = await getMessages(session.user.id, conversationId, cursor);
    return apiSuccess(msgs);
  } catch (e) {
    if (e instanceof NextResponse) return e;
    throw e;
  }
}
