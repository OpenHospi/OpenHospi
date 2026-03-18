import { and, desc, eq, lt, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  blocks,
  conversationMembers,
  conversations,
  messagePayloads,
  messageReceipts,
  messages,
  profiles,
  roomPhotos,
  rooms,
} from "@/lib/db/schema";

/**
 * Get or create a conversation for a room × seeker pair.
 * Auto-inserts conversation members.
 */
export async function getOrCreateConversation(
  roomId: string,
  seekerUserId: string,
  memberUserIds: string[],
) {
  return await db.transaction(async (tx) => {
    // Check if conversation already exists
    const [existing] = await tx
      .select({ id: conversations.id })
      .from(conversations)
      .where(and(eq(conversations.roomId, roomId), eq(conversations.seekerUserId, seekerUserId)));

    if (existing) return existing;

    // Create conversation
    const [conv] = await tx
      .insert(conversations)
      .values({ roomId, seekerUserId })
      .returning({ id: conversations.id });

    // Insert members
    const uniqueMembers = [...new Set(memberUserIds)];
    await tx.insert(conversationMembers).values(
      uniqueMembers.map((userId) => ({
        conversationId: conv.id,
        userId,
      })),
    );

    return conv;
  });
}

/**
 * List conversations for a user with unread counts and latest message info.
 */
export async function getConversations(userId: string) {
  // Get user's blocked list to filter
  const blockedRows = await db
    .select({ blockedId: blocks.blockedId })
    .from(blocks)
    .where(eq(blocks.blockerId, userId));
  const blockedIds = new Set(blockedRows.map((r) => r.blockedId));

  // Get conversations where user is a member
  const convRows = await db
    .select({
      id: conversations.id,
      roomId: conversations.roomId,
      seekerUserId: conversations.seekerUserId,
      createdAt: conversations.createdAt,
      roomTitle: rooms.title,
    })
    .from(conversations)
    .innerJoin(
      conversationMembers,
      and(
        eq(conversationMembers.conversationId, conversations.id),
        eq(conversationMembers.userId, userId),
      ),
    )
    .innerJoin(rooms, eq(rooms.id, conversations.roomId))
    .orderBy(desc(conversations.createdAt));

  // For each conversation, get unread count and latest message timestamp
  const result = await Promise.all(
    convRows.map(async (conv) => {
      // Unread count
      const [unread] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(messageReceipts)
        .innerJoin(messages, eq(messages.id, messageReceipts.messageId))
        .where(
          and(
            eq(messages.conversationId, conv.id),
            eq(messageReceipts.userId, userId),
            eq(messageReceipts.status, "sent"),
          ),
        );

      // Latest message timestamp
      const [latest] = await db
        .select({ createdAt: messages.createdAt })
        .from(messages)
        .where(eq(messages.conversationId, conv.id))
        .orderBy(desc(messages.createdAt))
        .limit(1);

      // Get members (for display)
      const members = await db
        .select({
          userId: conversationMembers.userId,
          firstName: profiles.firstName,
        })
        .from(conversationMembers)
        .innerJoin(profiles, eq(profiles.id, conversationMembers.userId))
        .where(eq(conversationMembers.conversationId, conv.id));

      // First room photo
      const [photo] = await db
        .select({ url: roomPhotos.url })
        .from(roomPhotos)
        .where(eq(roomPhotos.roomId, conv.roomId))
        .limit(1);

      return {
        ...conv,
        unreadCount: unread.count,
        lastMessageAt: latest?.createdAt ?? conv.createdAt,
        members: members.filter((m) => !blockedIds.has(m.userId)),
        roomPhotoUrl: photo?.url ?? null,
      };
    }),
  );

  // Filter out conversations where all other members are blocked
  return result.filter((conv) => conv.members.length > 0);
}

/**
 * Get paginated messages for a conversation.
 */
export async function getMessages(
  userId: string,
  conversationId: string,
  cursor?: string,
  limit = 50,
) {
  // Verify membership
  const [member] = await db
    .select({ userId: conversationMembers.userId })
    .from(conversationMembers)
    .where(
      and(
        eq(conversationMembers.conversationId, conversationId),
        eq(conversationMembers.userId, userId),
      ),
    );

  if (!member) return { messages: [], nextCursor: null };

  const conditions = [eq(messages.conversationId, conversationId)];
  if (cursor) {
    conditions.push(lt(messages.createdAt, new Date(cursor)));
  }

  const rows = await db
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
    .where(and(...conditions))
    .orderBy(desc(messages.createdAt))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const messageRows = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? messageRows[messageRows.length - 1].createdAt.toISOString() : null;

  return { messages: messageRows, nextCursor };
}

/**
 * Get conversation members with profiles.
 */
export async function getConversationMembers(userId: string, conversationId: string) {
  // Verify membership
  const [member] = await db
    .select({ userId: conversationMembers.userId })
    .from(conversationMembers)
    .where(
      and(
        eq(conversationMembers.conversationId, conversationId),
        eq(conversationMembers.userId, userId),
      ),
    );

  if (!member) return [];

  return await db
    .select({
      userId: conversationMembers.userId,
      firstName: profiles.firstName,
      joinedAt: conversationMembers.joinedAt,
    })
    .from(conversationMembers)
    .innerJoin(profiles, eq(profiles.id, conversationMembers.userId))
    .where(eq(conversationMembers.conversationId, conversationId));
}

/**
 * Get full conversation detail (room info + members).
 */
export async function getConversationDetail(userId: string, conversationId: string) {
  // Verify membership
  const [member] = await db
    .select({ userId: conversationMembers.userId })
    .from(conversationMembers)
    .where(
      and(
        eq(conversationMembers.conversationId, conversationId),
        eq(conversationMembers.userId, userId),
      ),
    );

  if (!member) return null;

  const [conv] = await db
    .select({
      id: conversations.id,
      roomId: conversations.roomId,
      seekerUserId: conversations.seekerUserId,
      createdAt: conversations.createdAt,
      roomTitle: rooms.title,
    })
    .from(conversations)
    .innerJoin(rooms, eq(rooms.id, conversations.roomId))
    .where(eq(conversations.id, conversationId));

  if (!conv) return null;

  const members = await getConversationMembers(userId, conversationId);

  return { ...conv, members };
}

/**
 * Count unread messages across all conversations for a user.
 */
export async function getUnreadChatCount(userId: string) {
  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(messageReceipts)
    .innerJoin(messages, eq(messages.id, messageReceipts.messageId))
    .innerJoin(
      conversationMembers,
      and(
        eq(conversationMembers.conversationId, messages.conversationId),
        eq(conversationMembers.userId, userId),
      ),
    )
    .where(and(eq(messageReceipts.userId, userId), eq(messageReceipts.status, "sent")));

  return result.count;
}
