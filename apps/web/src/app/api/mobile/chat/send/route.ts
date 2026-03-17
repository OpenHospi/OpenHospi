import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { apiError, requireApiSession } from "@/app/api/mobile/_lib/auth";
import { createDrizzleSupabaseClient } from "@/lib/db";
import { conversationMembers, messagePayloads, messageReceipts, messages } from "@/lib/db/schema";

export async function POST(request: Request) {
  try {
    const session = await requireApiSession(request);
    const { conversationId, payload, deviceId } = await request.json();

    if (!conversationId || !payload) {
      return apiError("Missing required fields", 422);
    }

    const msg = await createDrizzleSupabaseClient(session.user.id).rls(async (tx) => {
      // Verify membership
      const [member] = await tx
        .select({ userId: conversationMembers.userId })
        .from(conversationMembers)
        .where(
          and(
            eq(conversationMembers.conversationId, conversationId),
            eq(conversationMembers.userId, session.user.id),
          ),
        );

      if (!member) throw new Error("Not a member");

      const [msg] = await tx
        .insert(messages)
        .values({
          conversationId,
          senderId: session.user.id,
          senderDeviceId: deviceId ?? null,
          messageType: "ciphertext",
        })
        .returning();

      await tx.insert(messagePayloads).values({
        messageId: msg.id,
        conversationId,
        senderUserId: session.user.id,
        senderDeviceId: deviceId ?? null,
        payload,
      });

      const members = await tx
        .select({ userId: conversationMembers.userId })
        .from(conversationMembers)
        .where(eq(conversationMembers.conversationId, conversationId));

      const receiptValues = members
        .filter((m) => m.userId !== session.user.id)
        .map((m) => ({
          messageId: msg.id,
          userId: m.userId,
          status: "sent" as const,
        }));

      if (receiptValues.length > 0) {
        await tx.insert(messageReceipts).values(receiptValues);
      }

      return msg;
    });

    return NextResponse.json(msg);
  } catch (e) {
    if (e instanceof NextResponse) return e;
    throw e;
  }
}
