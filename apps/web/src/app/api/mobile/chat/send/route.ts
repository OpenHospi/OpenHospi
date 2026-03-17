import { and, eq, inArray, or } from "drizzle-orm";
import { NextResponse } from "next/server";

import { apiError, apiSuccess, requireApiSession } from "@/app/api/mobile/_lib/auth";
import { db, createDrizzleSupabaseClient } from "@/lib/db";
import {
  blocks,
  conversationMembers,
  messagePayloads,
  messageReceipts,
  messages,
} from "@/lib/db/schema";

type SerializedPayload = {
  senderKeyId: number;
  iteration: number;
  ciphertext: string;
  signature: string;
};

export async function POST(request: Request) {
  try {
    const session = await requireApiSession(request);
    const userId = session.user.id;

    const body = (await request.json()) as {
      conversationId?: string;
      payload?: string;
      senderDeviceId?: string;
    };

    if (!body.conversationId || !body.payload) {
      return apiError("conversationId and payload are required", 400);
    }

    // Parse the serialized payload
    let parsed: SerializedPayload;
    try {
      parsed = JSON.parse(body.payload) as SerializedPayload;
    } catch {
      return apiError("payload must be a valid JSON string", 400);
    }

    if (
      !parsed.ciphertext ||
      !parsed.signature ||
      parsed.senderKeyId == null ||
      parsed.iteration == null
    ) {
      return apiError(
        "payload must contain ciphertext, signature, senderKeyId, and iteration",
        400,
      );
    }

    // Get conversation members
    const members = await db
      .select({ userId: conversationMembers.userId })
      .from(conversationMembers)
      .where(eq(conversationMembers.conversationId, body.conversationId));

    const otherMemberIds = members.filter((m) => m.userId !== userId).map((m) => m.userId);

    // Check for bidirectional blocks
    if (otherMemberIds.length > 0) {
      const blockExists = await db
        .select({ blockerId: blocks.blockerId })
        .from(blocks)
        .where(
          or(
            and(eq(blocks.blockerId, userId), inArray(blocks.blockedId, otherMemberIds)),
            and(inArray(blocks.blockerId, otherMemberIds), eq(blocks.blockedId, userId)),
          ),
        )
        .limit(1);

      if (blockExists.length > 0) {
        return apiError(
          "Cannot send message — a block exists between you and a conversation member",
          403,
        );
      }
    }

    // Insert message metadata via RLS
    const [message] = await createDrizzleSupabaseClient(userId).rls(async (tx) => {
      return tx
        .insert(messages)
        .values({
          conversationId: body.conversationId!,
          senderId: userId,
          messageType: "text",
        })
        .returning({ id: messages.id });
    });

    // Insert message payload
    await db.insert(messagePayloads).values({
      messageId: message.id,
      conversationId: body.conversationId!,
      senderUserId: userId,
      senderDeviceId: body.senderDeviceId ?? null,
      ciphertext: parsed.ciphertext,
      signature: parsed.signature,
      senderKeyId: parsed.senderKeyId,
      iteration: parsed.iteration,
    });

    // Create receipts for other members
    const receipts = members
      .filter((m) => m.userId !== userId)
      .map((m) => ({
        messageId: message.id,
        userId: m.userId,
        status: "sent" as const,
      }));

    if (receipts.length > 0) {
      await db.insert(messageReceipts).values(receipts);
    }

    return apiSuccess({ messageId: message.id });
  } catch (e) {
    if (e instanceof NextResponse) return e;
    throw e;
  }
}
