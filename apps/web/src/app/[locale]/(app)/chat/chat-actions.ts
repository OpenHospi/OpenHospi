"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth/server";
import { db, createDrizzleSupabaseClient } from "@/lib/db";
import {
  conversationMembers,
  messagePayloads,
  messageReceipts,
  messages,
  profiles,
  senderKeyDistributions,
} from "@/lib/db/schema";
import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * Send an encrypted message to a conversation (legacy — kept for backward compatibility).
 */
export async function sendMessage(
  conversationId: string,
  payload: string,
  deviceId: string | null,
) {
  const session = await requireSession();

  const result = await createDrizzleSupabaseClient(session.user.id).rls(async (tx) => {
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

    const [msg] = await tx
      .insert(messages)
      .values({
        conversationId,
        senderId: session.user.id,
        senderDeviceId: deviceId,
        messageType: "ciphertext",
      })
      .returning();

    await tx.insert(messagePayloads).values({
      messageId: msg.id,
      conversationId,
      senderUserId: session.user.id,
      senderDeviceId: deviceId,
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

  await broadcastNewMessage(conversationId, result.id, session.user.id, deviceId);

  return result;
}

/**
 * Atomically send distributions + message in a single server call.
 * Distributions are stored first so they arrive before the message they protect.
 */
export async function sendMessageWithDistributions(
  conversationId: string,
  payload: string,
  deviceId: string,
  distributions: Array<{ recipientDeviceId: string; ciphertext: string }>,
) {
  const session = await requireSession();

  const result = await createDrizzleSupabaseClient(session.user.id).rls(async (tx) => {
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

    // Step 1: Store sender key distributions (if any)
    if (distributions.length > 0) {
      await tx.insert(senderKeyDistributions).values(
        distributions.map((dist) => ({
          conversationId,
          senderUserId: session.user.id,
          senderDeviceId: deviceId,
          recipientDeviceId: dist.recipientDeviceId,
          ciphertext: dist.ciphertext,
        })),
      );
    }

    // Step 2: Insert message
    const [msg] = await tx
      .insert(messages)
      .values({
        conversationId,
        senderId: session.user.id,
        senderDeviceId: deviceId,
        messageType: "ciphertext",
      })
      .returning();

    // Step 3: Insert encrypted payload
    await tx.insert(messagePayloads).values({
      messageId: msg.id,
      conversationId,
      senderUserId: session.user.id,
      senderDeviceId: deviceId,
      payload,
    });

    // Step 4: Create receipts for all other members
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

  // Broadcast distributions first, then the message
  if (distributions.length > 0) {
    await broadcastDistributions(conversationId, session.user.id, deviceId);
  }
  await broadcastNewMessage(conversationId, result.id, session.user.id, deviceId);

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

/**
 * Fetch a single message by ID (for realtime message arrival).
 */
export async function fetchMessageById(messageId: string) {
  await requireSession();

  const [row] = await db
    .select({
      id: messages.id,
      conversationId: messages.conversationId,
      senderId: messages.senderId,
      senderDeviceId: messages.senderDeviceId,
      messageType: messages.messageType,
      createdAt: messages.createdAt,
      payload: messagePayloads.payload,
      senderFirstName: profiles.firstName,
    })
    .from(messages)
    .leftJoin(messagePayloads, eq(messagePayloads.messageId, messages.id))
    .leftJoin(profiles, eq(profiles.id, messages.senderId))
    .where(eq(messages.id, messageId));

  return row ?? null;
}

// ── Realtime broadcast helpers ──

async function broadcastNewMessage(
  conversationId: string,
  messageId: string,
  senderId: string,
  senderDeviceId: string | null,
) {
  try {
    await supabaseAdmin.channel(`chat:${conversationId}`).send({
      type: "broadcast",
      event: "new_message",
      payload: { messageId, senderId, senderDeviceId },
    });
  } catch (err) {
    console.error("[chat-actions] Broadcast new_message failed:", err);
  }
}

async function broadcastDistributions(
  conversationId: string,
  senderId: string,
  senderDeviceId: string,
) {
  try {
    await supabaseAdmin.channel(`chat:${conversationId}`).send({
      type: "broadcast",
      event: "sender_key_distribution",
      payload: { senderId, senderDeviceId },
    });
  } catch (err) {
    console.error("[chat-actions] Broadcast sender_key_distribution failed:", err);
  }
}
