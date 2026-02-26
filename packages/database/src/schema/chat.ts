import { sql } from "drizzle-orm";
import { authUid, authenticatedRole, crudPolicy } from "drizzle-orm/neon";
import {
  boolean,
  index,
  pgPolicy,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { conversationTypeEnum, deliveryStatusEnum, messageTypeEnum } from "./enums";
import { profiles } from "./profiles";
import { rooms } from "./rooms";

export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    roomId: uuid("room_id").references(() => rooms.id, { onDelete: "cascade" }),
    type: conversationTypeEnum("type").notNull().default("direct"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Only conversation members can view (uses view to avoid recursion through conversation_members RLS)
    pgPolicy("conversations_select", {
      for: "select",
      to: authenticatedRole,
      using: sql`exists(select 1 from conversation_members_rls where conversation_members_rls.conversation_id = ${table.id} and conversation_members_rls.user_id = (select auth.user_id()))`,
    }),
    // Any authenticated user can create a conversation
    pgPolicy("conversations_insert", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`true`,
    }),
  ],
);

export const conversationMembers = pgTable(
  "conversation_members",
  {
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id),
    joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow(),
    muted: boolean("muted").default(false),
  },
  (table) => [
    primaryKey({ columns: [table.conversationId, table.userId] }),
    index("idx_conversation_members_user_id").on(table.userId),
    // All members of the same conversation can see each other (uses view to avoid infinite recursion)
    pgPolicy("conversation_members_select", {
      for: "select",
      to: authenticatedRole,
      using: sql`exists(select 1 from conversation_members_rls where conversation_members_rls.conversation_id = ${table.conversationId} and conversation_members_rls.user_id = (select auth.user_id()))`,
    }),
    // Self-add or existing member can add others (uses view to avoid recursion)
    pgPolicy("conversation_members_insert", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${table.userId} = (select auth.user_id()) or exists(select 1 from conversation_members_rls where conversation_members_rls.conversation_id = ${table.conversationId} and conversation_members_rls.user_id = (select auth.user_id()))`,
    }),
    // Own membership only (e.g. mute toggle)
    pgPolicy("conversation_members_update", {
      for: "update",
      to: authenticatedRole,
      using: authUid(table.userId),
    }),
    // Own membership only (leave)
    pgPolicy("conversation_members_delete", {
      for: "delete",
      to: authenticatedRole,
      using: authUid(table.userId),
    }),
  ],
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => profiles.id),
    ciphertext: text("ciphertext").notNull(),
    iv: text("iv").notNull(),
    messageType: messageTypeEnum("message_type").notNull().default("text"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_messages_conversation_created").on(table.conversationId, table.createdAt),
    // Conversation members can read messages (uses view to avoid recursion through conversation_members RLS)
    pgPolicy("messages_select", {
      for: "select",
      to: authenticatedRole,
      using: sql`exists(select 1 from conversation_members_rls where conversation_members_rls.conversation_id = ${table.conversationId} and conversation_members_rls.user_id = (select auth.user_id()))`,
    }),
    // Sender must be conversation member (uses view to avoid recursion)
    pgPolicy("messages_insert", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${table.senderId} = (select auth.user_id()) and exists(select 1 from conversation_members_rls where conversation_members_rls.conversation_id = ${table.conversationId} and conversation_members_rls.user_id = (select auth.user_id()))`,
    }),
    // Sender only can update
    pgPolicy("messages_update", {
      for: "update",
      to: authenticatedRole,
      using: authUid(table.senderId),
    }),
    // Sender only can delete
    pgPolicy("messages_delete", {
      for: "delete",
      to: authenticatedRole,
      using: authUid(table.senderId),
    }),
  ],
);

export const messageReceipts = pgTable(
  "message_receipts",
  {
    messageId: uuid("message_id")
      .notNull()
      .references(() => messages.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id),
    status: deliveryStatusEnum("status").notNull().default("sent"),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    readAt: timestamp("read_at", { withTimezone: true }),
  },
  (table) => [
    primaryKey({ columns: [table.messageId, table.userId] }),
    crudPolicy({
      role: authenticatedRole,
      read: authUid(table.userId),
      modify: authUid(table.userId),
    }),
  ],
);
