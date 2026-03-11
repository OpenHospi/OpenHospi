import { db, withRLS } from "@openhospi/database";
import {
  blocks,
  conversationMembers,
  messageCiphertexts,
  messageReceipts,
  messages,
} from "@openhospi/database/schema";
import { and, eq, inArray, or } from "drizzle-orm";
import { NextResponse } from "next/server";

import { apiError, apiSuccess, requireApiSession } from "@/app/api/mobile/_lib/auth";

type CiphertextPayload = {
  recipientUserId: string;
  ciphertext: string;
  iv: string;
  ratchetPublicKey: string;
  messageNumber: number;
  previousChainLength: number;
};

export async function POST(request: Request) {
  try {
    const session = await requireApiSession(request);
    const userId = session.user.id;

    const body = (await request.json()) as {
      conversationId?: string;
      payloads?: CiphertextPayload[];
    };

    if (!body.conversationId || !body.payloads || body.payloads.length === 0) {
      return apiError("conversationId and payloads array are required", 400);
    }

    // Validate each payload
    for (const p of body.payloads) {
      if (
        !p.recipientUserId ||
        !p.ciphertext ||
        !p.iv ||
        !p.ratchetPublicKey ||
        p.messageNumber == null ||
        p.previousChainLength == null
      ) {
        return apiError(
          "Each payload must include recipientUserId, ciphertext, iv, ratchetPublicKey, messageNumber, and previousChainLength",
          400,
        );
      }
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
    const [message] = await withRLS(userId, async (tx) => {
      return tx
        .insert(messages)
        .values({
          conversationId: body.conversationId!,
          senderId: userId,
          messageType: "text",
        })
        .returning({ id: messages.id });
    });

    // Insert ciphertexts for each recipient
    await db.insert(messageCiphertexts).values(
      body.payloads.map((p) => ({
        messageId: message.id,
        recipientUserId: p.recipientUserId,
        ciphertext: p.ciphertext,
        iv: p.iv,
        ratchetPublicKey: p.ratchetPublicKey,
        messageNumber: p.messageNumber,
        previousChainLength: p.previousChainLength,
      })),
    );

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
