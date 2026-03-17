import { MESSAGES_PER_PAGE } from "@openhospi/shared/constants";
import { and, count, desc, eq, inArray, isNull, lt, sql } from "drizzle-orm";

import { db, createDrizzleSupabaseClient } from "@/lib/db";
import {
  conversationMembers,
  conversations,
  messagePayloads,
  messageReceipts,
  messages,
  profiles,
  roomPhotos,
  rooms,
} from "@/lib/db/schema";

export async function getOrCreateHospiConversation(
  roomId: string,
  seekerUserId: string,
  memberUserIds: string[],
): Promise<string> {
  const [existing] = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(and(eq(conversations.roomId, roomId), eq(conversations.seekerUserId, seekerUserId)));

  if (existing) return existing.id;

  const [conv] = await db
    .insert(conversations)
    .values({ roomId, seekerUserId, type: "direct" })
    .returning({ id: conversations.id });

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
  lastMessageAt: Date | null;
  unreadCount: number;
  members: { userId: string; firstName: string; lastName: string; avatarUrl: string | null }[];
};

export async function getConversations(userId: string): Promise<ConversationListItem[]> {
  return createDrizzleSupabaseClient(userId).rls(async (tx) => {
    const convos = await tx
      .select({
        id: conversations.id,
        type: conversations.type,
        roomTitle: rooms.title,
        lastMessageAt: sql<Date | null>`(select m.created_at from messages m where m.conversation_id = ${conversations.id} order by m.created_at desc limit 1)`,
        unreadCount: sql<number>`(
          select count(*)::int from messages m
          left join message_receipts mr on mr.message_id = m.id and mr.user_id = ${userId}
          where m.conversation_id = ${conversations.id} and mr.read_at is null
        )`,
      })
      .from(conversations)
      .innerJoin(conversationMembers, eq(conversationMembers.conversationId, conversations.id))
      .leftJoin(rooms, eq(rooms.id, conversations.roomId))
      .where(
        and(
          eq(conversationMembers.userId, userId),
          sql`not exists(
            select 1 from conversation_members cm2
            inner join blocks b on
              (b.blocker_id = ${userId} and b.blocked_id = cm2.user_id)
              or (b.blocker_id = cm2.user_id and b.blocked_id = ${userId})
            where cm2.conversation_id = ${conversations.id}
              and cm2.user_id != ${userId}
          )`,
        ),
      )
      .orderBy(
        sql`(select m.created_at from messages m where m.conversation_id = ${conversations.id} order by m.created_at desc limit 1) desc nulls last`,
      );

    const convIds = convos.map((c) => c.id);
    const allMembers =
      convIds.length > 0
        ? await tx
            .select({
              conversationId: conversationMembers.conversationId,
              userId: conversationMembers.userId,
              firstName: profiles.firstName,
              lastName: profiles.lastName,
              avatarUrl: profiles.avatarUrl,
            })
            .from(conversationMembers)
            .innerJoin(profiles, eq(profiles.id, conversationMembers.userId))
            .where(inArray(conversationMembers.conversationId, convIds))
        : [];

    const membersByConv = new Map<
      string,
      { userId: string; firstName: string; lastName: string; avatarUrl: string | null }[]
    >();
    for (const m of allMembers) {
      const list = membersByConv.get(m.conversationId) ?? [];
      list.push({
        userId: m.userId,
        firstName: m.firstName,
        lastName: m.lastName,
        avatarUrl: m.avatarUrl,
      });
      membersByConv.set(m.conversationId, list);
    }

    return convos.map((c) => ({
      id: c.id,
      type: c.type,
      roomTitle: c.roomTitle,
      lastMessageAt: c.lastMessageAt,
      unreadCount: c.unreadCount ?? 0,
      members: membersByConv.get(c.id) ?? [],
    }));
  });
}

export type MessageItem = {
  id: string;
  senderId: string;
  senderFirstName: string;
  senderAvatarUrl: string | null;
  ciphertext: string | null;
  signature: string | null;
  senderKeyId: number | null;
  iteration: number | null;
  senderDeviceId: string | null;
  messageType: string;
  createdAt: Date;
};

/**
 * Get messages for a conversation.
 * Joins with message_payloads (1:1) — all members see the same payload.
 */
export async function getMessages(
  userId: string,
  conversationId: string,
  cursor?: Date,
): Promise<MessageItem[]> {
  return createDrizzleSupabaseClient(userId).rls(async (tx) => {
    const conditions = [eq(messages.conversationId, conversationId)];
    if (cursor) {
      conditions.push(lt(messages.createdAt, cursor));
    }

    const rows = await tx
      .select({
        id: messages.id,
        senderId: messages.senderId,
        senderFirstName: profiles.firstName,
        senderAvatarUrl: profiles.avatarUrl,
        ciphertext: messagePayloads.ciphertext,
        signature: messagePayloads.signature,
        senderKeyId: messagePayloads.senderKeyId,
        iteration: messagePayloads.iteration,
        senderDeviceId: messagePayloads.senderDeviceId,
        messageType: messages.messageType,
        createdAt: messages.createdAt,
      })
      .from(messages)
      .innerJoin(profiles, eq(profiles.id, messages.senderId))
      .leftJoin(messagePayloads, eq(messagePayloads.messageId, messages.id))
      .where(and(...conditions))
      .orderBy(desc(messages.createdAt))
      .limit(MESSAGES_PER_PAGE);

    return rows.map((row) => ({
      ...row,
      senderId: row.senderId!,
      messageType: row.messageType as string,
    }));
  });
}

export async function getConversationMembers(
  userId: string,
  conversationId: string,
): Promise<{ userId: string; firstName: string; lastName: string; avatarUrl: string | null }[]> {
  return createDrizzleSupabaseClient(userId).rls(async (tx) => {
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
  return createDrizzleSupabaseClient(userId).rls(async (tx) => {
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
        and(eq(messageReceipts.messageId, messages.id), eq(messageReceipts.userId, userId)),
      )
      .where(isNull(messageReceipts.readAt));

    return result?.count ?? 0;
  });
}

export type ConversationDetail = {
  id: string;
  roomId: string | null;
  seekerUserId: string | null;
  type: string;
  room: {
    id: string;
    title: string;
    city: string;
    rentPrice: string;
    coverPhotoUrl: string | null;
  } | null;
  members: {
    userId: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
    role: "seeker" | "house_member";
  }[];
};

export async function getConversationDetail(
  userId: string,
  conversationId: string,
): Promise<ConversationDetail | null> {
  return createDrizzleSupabaseClient(userId).rls(async (tx) => {
    const [conv] = await tx
      .select({
        id: conversations.id,
        roomId: conversations.roomId,
        seekerUserId: conversations.seekerUserId,
        type: conversations.type,
      })
      .from(conversations)
      .where(eq(conversations.id, conversationId));

    if (!conv) return null;

    // Fetch room info if roomId exists
    let roomInfo: ConversationDetail["room"] = null;
    if (conv.roomId) {
      const [room] = await tx
        .select({
          id: rooms.id,
          title: rooms.title,
          city: rooms.city,
          rentPrice: rooms.rentPrice,
        })
        .from(rooms)
        .where(eq(rooms.id, conv.roomId));

      if (room) {
        // Get cover photo (slot 0)
        const [coverPhoto] = await tx
          .select({ url: roomPhotos.url })
          .from(roomPhotos)
          .where(and(eq(roomPhotos.roomId, room.id), eq(roomPhotos.slot, 0)));

        roomInfo = {
          id: room.id,
          title: room.title,
          city: room.city,
          rentPrice: room.rentPrice,
          coverPhotoUrl: coverPhoto?.url ?? null,
        };
      }
    }

    // Fetch members with roles
    const memberRows = await tx
      .select({
        userId: conversationMembers.userId,
        firstName: profiles.firstName,
        lastName: profiles.lastName,
        avatarUrl: profiles.avatarUrl,
      })
      .from(conversationMembers)
      .innerJoin(profiles, eq(profiles.id, conversationMembers.userId))
      .where(eq(conversationMembers.conversationId, conversationId));

    const members: ConversationDetail["members"] = memberRows.map((m) => ({
      ...m,
      role: m.userId === conv.seekerUserId ? "seeker" : "house_member",
    }));

    return {
      id: conv.id,
      roomId: conv.roomId,
      seekerUserId: conv.seekerUserId,
      type: conv.type,
      room: roomInfo,
      members,
    };
  });
}
