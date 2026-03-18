import { and, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";

import { requireApiSession } from "@/app/api/mobile/_lib/auth";
import { db } from "@/lib/db";
import { messageReceipts, messages } from "@/lib/db/schema";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireApiSession(request);
    const { id: conversationId } = await params;

    await db
      .update(messageReceipts)
      .set({ status: "read", readAt: new Date() })
      .where(
        and(
          eq(messageReceipts.userId, session.user.id),
          inArray(
            messageReceipts.messageId,
            db
              .select({ id: messages.id })
              .from(messages)
              .where(eq(messages.conversationId, conversationId)),
          ),
        ),
      );

    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof NextResponse) return e;
    throw e;
  }
}
