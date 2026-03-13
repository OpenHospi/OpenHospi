"use server";

import type { GroupCiphertextPayload } from "@openhospi/crypto";
import { db, createDrizzleSupabaseClient } from "@/lib/db";
import {
  blocks,
  conversationMembers,
  messagePayloads,
  messageReceipts,
  messages,
} from "@/lib/db/schema";
import { and, eq, inArray, or } from "drizzle-orm";

import { requireNotRestricted, requireSession } from "@/lib/auth/server";
import { getOrCreateHospiConversation } from "@/lib/queries/chat";

export type { GroupCiphertextPayload } from "@openhospi/crypto";

export async function sendMessage(conversationId: string, payload: GroupCiphertextPayload) {
  const session = await requireSession();
  const userId = session.user.id;

  const restricted = await requireNotRestricted(userId);
  if (restricted) throw new Error(restricted.error);

  // Check for bidirectional blocks with any conversation member
  const members = await db
    .select({ userId: conversationMembers.userId })
    .from(conversationMembers)
    .where(eq(conversationMembers.conversationId, conversationId));

  const otherMemberIds = members.filter((m) => m.userId !== userId).map((m) => m.userId);

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
      throw new Error("Cannot send message — a block exists between you and a conversation member");
    }
  }

  // Insert message metadata
  const [message] = await createDrizzleSupabaseClient(userId).rls(async (tx) => {
    return tx
      .insert(messages)
      .values({
        conversationId,
        senderId: userId,
        messageType: "text",
      })
      .returning({ id: messages.id });
  });

  // Insert single payload for all recipients
  await db.insert(messagePayloads).values({
    messageId: message.id,
    conversationId,
    senderUserId: userId,
    ciphertext: payload.ciphertext,
    iv: payload.iv,
    signature: payload.signature,
    chainIteration: payload.chainIteration,
    chainId: payload.chainId,
  });

  // Create receipts for all members except sender
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

  return { messageId: message.id };
}

export async function markConversationRead(conversationId: string) {
  const session = await requireSession();
  const userId = session.user.id;

  await createDrizzleSupabaseClient(userId).rls(async (tx) => {
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
}

export async function getMessageMetadata(
  messageId: string,
): Promise<{ senderId: string; createdAt: Date } | null> {
  await requireSession();

  const [msg] = await db
    .select({ senderId: messages.senderId, createdAt: messages.createdAt })
    .from(messages)
    .where(eq(messages.id, messageId));

  if (!msg || !msg.senderId) return null;
  return { senderId: msg.senderId, createdAt: msg.createdAt };
}

export async function openChat(roomId: string, seekerUserId: string, memberUserIds: string[]) {
  const session = await requireSession();
  const userId = session.user.id;

  if (userId !== seekerUserId && !memberUserIds.includes(userId)) {
    throw new Error("Not authorized to open this chat");
  }

  const allMembers = [...new Set([...memberUserIds, seekerUserId])];
  const conversationId = await getOrCreateHospiConversation(roomId, seekerUserId, allMembers);

  return { conversationId };
}
