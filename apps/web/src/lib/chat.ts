import { db, withRLS } from "@openhospi/database";
import {
  blocks,
  conversationMembers,
  conversations,
  messageReceipts,
  messages,
  profiles,
  rooms,
} from "@openhospi/database/schema";
import { MESSAGES_PER_PAGE } from "@openhospi/shared/constants";
import { and, count, desc, eq, exists, isNull, lt, or, sql } from "drizzle-orm";

export async function getOrCreateHospiConversation(
  roomId: string,
  seekerUserId: string,
  memberUserIds: string[],
): Promise<string> {
  // Check if conversation already exists (uses db directly — called from server actions)
  const [existing] = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(
      and(eq(conversations.roomId, roomId), eq(conversations.seekerUserId, seekerUserId)),
    );

  if (existing) return existing.id;

  // Create new conversation
  const [conv] = await db
    .insert(conversations)
    .values({ roomId, seekerUserId, type: "direct" })
    .returning({ id: conversations.id });

  // Add all members
  const members = memberUserIds.map((userId) => ({
    conversationId: conv.id,
    userId,
  }));

  if (members.length > 0) {
    await db.insert(conversationMembers).values(members);
  }

  return conv.id;
}

export type ConversationListItem = {
  id: string;
  type: string;
  roomTitle: string | null;
  lastMessage: string | null;
  lastMessageAt: Date | null;
  unreadCount: number;
  members: { userId: string; firstName: string; lastName: string; avatarUrl: string | null }[];
};

export async function getConversations(userId: string): Promise<ConversationListItem[]> {
  return withRLS(userId, async (tx) => {
    // Get all conversations the user is a member of
    const convos = await tx
      .select({
        id: conversations.id,
        type: conversations.type,
        roomId: conversations.roomId,
      })
      .from(conversations)
      .innerJoin(
        conversationMembers,
        eq(conversationMembers.conversationId, conversations.id),
      )
      .where(eq(conversationMembers.userId, userId))
      .orderBy(desc(conversations.createdAt));

    // Filter out conversations where any other member has a block relationship with current user
    const filteredConvos = [];
    for (const conv of convos) {
      const otherMembers = await tx
        .select({ userId: conversationMembers.userId })
        .from(conversationMembers)
        .where(
          and(
            eq(conversationMembers.conversationId, conv.id),
            sql`${conversationMembers.userId} != ${userId}`,
          ),
        );

      const hasBlock = otherMembers.length > 0
        ? await tx
            .select({ blockerId: blocks.blockerId })
            .from(blocks)
            .where(
              or(
                and(
                  eq(blocks.blockerId, userId),
                  sql`${blocks.blockedId} IN (${sql.join(otherMembers.map((m) => sql`${m.userId}`), sql`, `)})`,
                ),
                and(
                  eq(blocks.blockedId, userId),
                  sql`${blocks.blockerId} IN (${sql.join(otherMembers.map((m) => sql`${m.userId}`), sql`, `)})`,
                ),
              ),
            )
            .limit(1)
        : [];

      if (hasBlock.length === 0) {
        filteredConvos.push(conv);
      }
    }

    const result: ConversationListItem[] = [];

    for (const conv of filteredConvos) {
      // Get room title if applicable
      let roomTitle: string | null = null;
      if (conv.roomId) {
        const [room] = await tx
          .select({ title: rooms.title })
          .from(rooms)
          .where(eq(rooms.id, conv.roomId));
        roomTitle = room?.title ?? null;
      }

      // Get last message
      const [lastMsg] = await tx
        .select({
          ciphertext: messages.ciphertext,
          createdAt: messages.createdAt,
        })
        .from(messages)
        .where(eq(messages.conversationId, conv.id))
        .orderBy(desc(messages.createdAt))
        .limit(1);

      // Get unread count
      const [unread] = await tx
        .select({ count: count() })
        .from(messages)
        .leftJoin(
          messageReceipts,
          and(
            eq(messageReceipts.messageId, messages.id),
            eq(messageReceipts.userId, userId),
          ),
        )
        .where(
          and(
            eq(messages.conversationId, conv.id),
            isNull(messageReceipts.readAt),
          ),
        );

      // Get members
      const members = await tx
        .select({
          userId: conversationMembers.userId,
          firstName: profiles.firstName,
          lastName: profiles.lastName,
          avatarUrl: profiles.avatarUrl,
        })
        .from(conversationMembers)
        .innerJoin(profiles, eq(profiles.id, conversationMembers.userId))
        .where(eq(conversationMembers.conversationId, conv.id));

      result.push({
        id: conv.id,
        type: conv.type,
        roomTitle,
        lastMessage: lastMsg?.ciphertext ?? null,
        lastMessageAt: lastMsg?.createdAt ?? null,
        unreadCount: unread?.count ?? 0,
        members,
      });
    }

    // Sort by last message time (most recent first)
    result.sort((a, b) => {
      if (!a.lastMessageAt && !b.lastMessageAt) return 0;
      if (!a.lastMessageAt) return 1;
      if (!b.lastMessageAt) return -1;
      return b.lastMessageAt.getTime() - a.lastMessageAt.getTime();
    });

    return result;
  });
}

export type MessageItem = {
  id: string;
  senderId: string;
  senderFirstName: string;
  senderAvatarUrl: string | null;
  ciphertext: string;
  iv: string;
  encryptedKeys: unknown;
  messageType: string;
  createdAt: Date;
};

export async function getMessages(
  userId: string,
  conversationId: string,
  cursor?: Date,
): Promise<MessageItem[]> {
  return withRLS(userId, async (tx) => {
    const conditions = [eq(messages.conversationId, conversationId)];
    if (cursor) {
      conditions.push(lt(messages.createdAt, cursor));
    }

    return tx
      .select({
        id: messages.id,
        senderId: messages.senderId,
        senderFirstName: profiles.firstName,
        senderAvatarUrl: profiles.avatarUrl,
        ciphertext: messages.ciphertext,
        iv: messages.iv,
        encryptedKeys: messages.encryptedKeys,
        messageType: messages.messageType,
        createdAt: messages.createdAt,
      })
      .from(messages)
      .innerJoin(profiles, eq(profiles.id, messages.senderId))
      .where(and(...conditions))
      .orderBy(desc(messages.createdAt))
      .limit(MESSAGES_PER_PAGE);
  });
}

export async function getConversationMembers(
  userId: string,
  conversationId: string,
): Promise<{ userId: string; firstName: string; lastName: string; avatarUrl: string | null }[]> {
  return withRLS(userId, async (tx) => {
    return tx
      .select({
        userId: conversationMembers.userId,
        firstName: profiles.firstName,
        lastName: profiles.lastName,
        avatarUrl: profiles.avatarUrl,
      })
      .from(conversationMembers)
      .innerJoin(profiles, eq(profiles.id, conversationMembers.userId))
      .where(eq(conversationMembers.conversationId, conversationId));
  });
}

export async function getUnreadChatCount(userId: string): Promise<number> {
  return withRLS(userId, async (tx) => {
    const [result] = await tx
      .select({ count: count() })
      .from(messages)
      .innerJoin(
        conversationMembers,
        and(
          eq(conversationMembers.conversationId, messages.conversationId),
          eq(conversationMembers.userId, userId),
        ),
      )
      .leftJoin(
        messageReceipts,
        and(
          eq(messageReceipts.messageId, messages.id),
          eq(messageReceipts.userId, userId),
        ),
      )
      .where(isNull(messageReceipts.readAt));

    return result?.count ?? 0;
  });
}
