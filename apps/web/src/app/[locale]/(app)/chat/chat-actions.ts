"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth/server";
import { createDrizzleSupabaseClient } from "@/lib/db";
import { conversationMembers, messagePayloads, messageReceipts, messages } from "@/lib/db/schema";

/**
 * Send an encrypted message to a conversation.
 */
export async function sendMessage(
  conversationId: string,
  payload: string,
  deviceId: string | null,
) {
  const session = await requireSession();

  const result = await createDrizzleSupabaseClient(session.user.id).rls(async (tx) => {
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

    if (!member) throw new Error("Not a member of this conversation");

    // Insert message
    const [msg] = await tx
      .insert(messages)
      .values({
        conversationId,
        senderId: session.user.id,
        senderDeviceId: deviceId,
        messageType: "ciphertext",
      })
      .returning();

    // Insert payload
    await tx.insert(messagePayloads).values({
      messageId: msg.id,
      conversationId,
      senderUserId: session.user.id,
      senderDeviceId: deviceId,
      payload,
    });

    // Create receipts for all other members
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

  return result;
}

/**
 * Mark all messages in a conversation as read.
 */
export async function markConversationRead(conversationId: string) {
  const session = await requireSession();

  await createDrizzleSupabaseClient(session.user.id).rls(async (tx) => {
    await tx
      .update(messageReceipts)
      .set({ status: "read", readAt: new Date() })
      .where(
        and(
          eq(messageReceipts.userId, session.user.id),
          eq(
            messageReceipts.messageId,
            tx
              .select({ id: messages.id })
              .from(messages)
              .where(eq(messages.conversationId, conversationId)),
          ),
        ),
      );
  });

  revalidatePath("/chat");
}
