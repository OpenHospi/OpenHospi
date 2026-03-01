"use server";

import { db, withRLS } from "@openhospi/database";
import { blocks, conversationMembers, messageReceipts, messages } from "@openhospi/database/schema";
import { and, eq, inArray, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth-server";
import { getOrCreateHospiConversation } from "@/lib/chat";

export async function sendMessage(
  conversationId: string,
  data: {
    ciphertext: string;
    iv: string;
    encryptedKeys: { userId: string; wrappedKey: string }[];
  },
) {
  const session = await requireSession();
  const userId = session.user.id;

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

  const [message] = await withRLS(userId, async (tx) => {
    return tx
      .insert(messages)
      .values({
        conversationId,
        senderId: userId,
        ciphertext: data.ciphertext,
        iv: data.iv,
        encryptedKeys: data.encryptedKeys,
        messageType: "text",
      })
      .returning({ id: messages.id });
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

  await withRLS(userId, async (tx) => {
    // Get all unread message IDs in this conversation for this user
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

    for (const receipt of unreadReceipts) {
      await tx
        .update(messageReceipts)
        .set({ status: "read", readAt: new Date() })
        .where(
          and(eq(messageReceipts.messageId, receipt.messageId), eq(messageReceipts.userId, userId)),
        );
    }
  });

  revalidatePath("/chat");
}

export async function openChat(roomId: string, seekerUserId: string, memberUserIds: string[]) {
  await requireSession();

  // Ensure the current user is in the member list
  const allMembers = [...new Set([...memberUserIds, seekerUserId])];

  const conversationId = await getOrCreateHospiConversation(roomId, seekerUserId, allMembers);

  return { conversationId };
}
