import { withRLS } from "@openhospi/database";
import { messageReceipts, messages } from "@openhospi/database/schema";
import { and, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";

import { apiSuccess, requireApiSession } from "@/app/api/mobile/_lib/auth";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await requireApiSession(request);
    const userId = session.user.id;
    const { id: conversationId } = await params;

    await withRLS(userId, async (tx) => {
      const unreadReceipts = await tx
        .select({ messageId: messageReceipts.messageId })
        .from(messageReceipts)
        .innerJoin(messages, eq(messages.id, messageReceipts.messageId))
        .where(
          and(
            eq(messages.conversationId, conversationId),
            eq(messageReceipts.userId, userId),
            eq(messageReceipts.status, "sent"),
          ),
        );

      const unreadIds = unreadReceipts.map((r) => r.messageId);
      if (unreadIds.length > 0) {
        await tx
          .update(messageReceipts)
          .set({ status: "read", readAt: new Date() })
          .where(
            and(inArray(messageReceipts.messageId, unreadIds), eq(messageReceipts.userId, userId)),
          );
      }
    });

    return apiSuccess({ success: true });
  } catch (e) {
    if (e instanceof NextResponse) return e;
    throw e;
  }
}
