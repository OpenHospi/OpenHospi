import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  jsonb,
  pgPolicy,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { authUid, authenticatedRole } from "drizzle-orm/supabase";

import { conversationTypeEnum, deliveryStatusEnum, messageTypeEnum } from "./enums";
import { profiles } from "./profiles";
import { rooms } from "./rooms";

export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    roomId: uuid("room_id").references(() => rooms.id, { onDelete: "cascade" }),
    seekerUserId: uuid("seeker_user_id").references(() => profiles.id, { onDelete: "set null" }),
    type: conversationTypeEnum("type").notNull().default("direct"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("conversations_room_id_seeker_user_id_key").on(table.roomId, table.seekerUserId),
    pgPolicy("conversations_select", {
      for: "select",
      to: authenticatedRole,
      using: sql`exists(select 1 from conversation_members_rls where conversation_members_rls.conversation_id = ${table.id} and conversation_members_rls.user_id = (select auth.uid()))`,
    }),
    pgPolicy("conversations_insert", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${table.seekerUserId} = (select auth.uid()) or exists(select 1 from house_members_rls hm inner join rooms r on r.house_id = hm.house_id where r.id = ${table.roomId} and hm.user_id = (select auth.uid()))`,
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
      .references(() => profiles.id, { onDelete: "cascade" }),
    joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow(),
    muted: boolean("muted").default(false),
  },
  (table) => [
    primaryKey({ columns: [table.conversationId, table.userId] }),
    index("idx_conversation_members_user_id").on(table.userId),
    pgPolicy("conversation_members_select", {
      for: "select",
      to: authenticatedRole,
      using: sql`exists(select 1 from conversation_members_rls where conversation_members_rls.conversation_id = ${table.conversationId} and conversation_members_rls.user_id = (select auth.uid()))`,
    }),
    pgPolicy("conversation_members_insert", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${table.userId} = (select auth.uid()) or exists(select 1 from conversation_members_rls where conversation_members_rls.conversation_id = ${table.conversationId} and conversation_members_rls.user_id = (select auth.uid()))`,
    }),
    pgPolicy("conversation_members_update", {
      for: "update",
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
    }),
    pgPolicy("conversation_members_delete", {
      for: "delete",
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
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
    senderId: uuid("sender_id").references(() => profiles.id, { onDelete: "set null" }),
    ciphertext: text("ciphertext").notNull(),
    iv: text("iv").notNull(),
    encryptedKeys: jsonb("encrypted_keys"),
    messageType: messageTypeEnum("message_type").notNull().default("text"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_messages_conversation_created").on(table.conversationId, table.createdAt),
    pgPolicy("messages_select", {
      for: "select",
      to: authenticatedRole,
      using: sql`exists(select 1 from conversation_members_rls where conversation_members_rls.conversation_id = ${table.conversationId} and conversation_members_rls.user_id = (select auth.uid()))`,
    }),
    pgPolicy("messages_insert", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${table.senderId} = (select auth.uid()) and exists(select 1 from conversation_members_rls where conversation_members_rls.conversation_id = ${table.conversationId} and conversation_members_rls.user_id = (select auth.uid()))`,
    }),
    pgPolicy("messages_update", {
      for: "update",
      to: authenticatedRole,
      using: sql`${table.senderId} = ${authUid}`,
    }),
    pgPolicy("messages_delete", {
      for: "delete",
      to: authenticatedRole,
      using: sql`${table.senderId} = ${authUid}`,
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
      .references(() => profiles.id, { onDelete: "cascade" }),
    status: deliveryStatusEnum("status").notNull().default("sent"),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    readAt: timestamp("read_at", { withTimezone: true }),
  },
  (table) => [
    primaryKey({ columns: [table.messageId, table.userId] }),
    pgPolicy("message_receipts_select", {
      for: "select",
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
    }),
    pgPolicy("message_receipts_insert", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${table.userId} = ${authUid}`,
    }),
    pgPolicy("message_receipts_update", {
      for: "update",
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
      withCheck: sql`${table.userId} = ${authUid}`,
    }),
    pgPolicy("message_receipts_delete", {
      for: "delete",
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
    }),
  ],
);
