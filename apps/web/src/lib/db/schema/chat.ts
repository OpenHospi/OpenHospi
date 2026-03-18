import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  pgPolicy,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { authUid, authenticatedRole } from "drizzle-orm/supabase";

import { user } from "./auth-schema";
import { devices } from "./encryption-schema";
import { deliveryStatusEnum, messageTypeEnum, senderKeyDistributionStatusEnum } from "./enums";
import { profiles } from "./profiles";
import { rooms } from "./rooms";

// ── Conversations ──

export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    roomId: uuid("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    seekerUserId: uuid("seeker_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("uq_conversations_room_seeker").on(table.roomId, table.seekerUserId),
    index("idx_conversations_room_id").on(table.roomId),
    index("idx_conversations_seeker").on(table.seekerUserId),
    // Users can see conversations they are a member of
    pgPolicy("conversations_select_member", {
      for: "select",
      to: authenticatedRole,
      using: sql`exists(select 1 from conversation_members where conversation_members.conversation_id = ${table.id} and conversation_members.user_id = ${authUid})`,
    }),
    pgPolicy("conversations_insert_authenticated", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`true`,
    }),
  ],
);

// ── Conversation Members ──

export const conversationMembers = pgTable(
  "conversation_members",
  {
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
    muted: boolean("muted").notNull().default(false),
  },
  (table) => [
    primaryKey({ columns: [table.conversationId, table.userId] }),
    index("idx_conversation_members_user_id").on(table.userId),
    pgPolicy("conversation_members_select_member", {
      for: "select",
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid} or exists(select 1 from conversation_members cm where cm.conversation_id = ${table.conversationId} and cm.user_id = ${authUid})`,
    }),
    pgPolicy("conversation_members_insert_authenticated", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`true`,
    }),
    pgPolicy("conversation_members_update_own", {
      for: "update",
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
    }),
  ],
);

// ── Messages ──

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    senderDeviceId: uuid("sender_device_id").references(() => devices.id, {
      onDelete: "set null",
    }),
    messageType: messageTypeEnum("message_type").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_messages_conversation_created").on(table.conversationId, table.createdAt),
    index("idx_messages_sender_id").on(table.senderId),
    // Members can see messages in their conversations
    pgPolicy("messages_select_member", {
      for: "select",
      to: authenticatedRole,
      using: sql`exists(select 1 from conversation_members where conversation_members.conversation_id = ${table.conversationId} and conversation_members.user_id = ${authUid})`,
    }),
    // Sender must match auth.uid()
    pgPolicy("messages_insert_sender", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${table.senderId} = ${authUid}`,
    }),
  ],
);

// ── Message Payloads (encrypted ciphertext) ──

export const messagePayloads = pgTable(
  "message_payloads",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    messageId: uuid("message_id")
      .notNull()
      .unique()
      .references(() => messages.id, { onDelete: "cascade" }),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    senderUserId: uuid("sender_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    senderDeviceId: uuid("sender_device_id").references(() => devices.id, {
      onDelete: "set null",
    }),
    payload: text("payload").notNull(),
    senderCopy: text("sender_copy"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_message_payloads_conversation").on(table.conversationId),
    // Members can see payloads in their conversations
    pgPolicy("message_payloads_select_member", {
      for: "select",
      to: authenticatedRole,
      using: sql`exists(select 1 from conversation_members where conversation_members.conversation_id = ${table.conversationId} and conversation_members.user_id = ${authUid})`,
    }),
    pgPolicy("message_payloads_insert_sender", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${table.senderUserId} = ${authUid}`,
    }),
  ],
);

// ── Message Receipts ──

export const messageReceipts = pgTable(
  "message_receipts",
  {
    messageId: uuid("message_id")
      .notNull()
      .references(() => messages.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    status: deliveryStatusEnum("status").notNull().default("sent"),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    readAt: timestamp("read_at", { withTimezone: true }),
  },
  (table) => [
    primaryKey({ columns: [table.messageId, table.userId] }),
    index("idx_message_receipts_user_id").on(table.userId),
    pgPolicy("message_receipts_select_own", {
      for: "select",
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
    }),
    pgPolicy("message_receipts_update_own", {
      for: "update",
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
    }),
    pgPolicy("message_receipts_insert_authenticated", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`true`,
    }),
  ],
);

// ── Sender Key Distributions ──

export const senderKeyDistributions = pgTable(
  "sender_key_distributions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    senderUserId: uuid("sender_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    senderDeviceId: uuid("sender_device_id")
      .notNull()
      .references(() => devices.id, { onDelete: "cascade" }),
    recipientDeviceId: uuid("recipient_device_id")
      .notNull()
      .references(() => devices.id, { onDelete: "cascade" }),
    ciphertext: text("ciphertext").notNull(),
    status: senderKeyDistributionStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_skd_recipient_status").on(table.recipientDeviceId, table.status),
    index("idx_skd_conversation").on(table.conversationId),
    pgPolicy("skd_select_participant", {
      for: "select",
      to: authenticatedRole,
      using: sql`exists(select 1 from devices where devices.id = ${table.recipientDeviceId} and devices.user_id = ${authUid}) or ${table.senderUserId} = ${authUid}`,
    }),
    pgPolicy("skd_insert_sender", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${table.senderUserId} = ${authUid}`,
    }),
    pgPolicy("skd_update_recipient", {
      for: "update",
      to: authenticatedRole,
      using: sql`exists(select 1 from devices where devices.id = ${table.recipientDeviceId} and devices.user_id = ${authUid})`,
    }),
  ],
);
