import { sql } from "drizzle-orm";
import { authUid, authenticatedRole } from "drizzle-orm/supabase";
import {
  boolean,
  index,
  jsonb,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import { adminActionEnum } from "./enums";
import { profiles } from "./profiles";

export const pushTokens = pgTable(
  "push_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    expoPushToken: text("expo_push_token").notNull(),
    deviceType: text("device_type"),
    active: boolean("active").default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (table) => [
    unique("push_tokens_user_id_expo_push_token_key").on(table.userId, table.expoPushToken),
    index("idx_push_tokens_user_id").on(table.userId),
    pgPolicy("push_tokens_select", {
      for: "select",
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
    }),
    pgPolicy("push_tokens_insert", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${table.userId} = ${authUid}`,
    }),
    pgPolicy("push_tokens_update", {
      for: "update",
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
      withCheck: sql`${table.userId} = ${authUid}`,
    }),
    pgPolicy("push_tokens_delete", {
      for: "delete",
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
    }),
  ],
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    body: text("body").notNull(),
    data: jsonb("data").default({}),
    sent: boolean("sent").default(false),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_notifications_user_id").on(table.userId, table.createdAt),
    pgPolicy("notifications_select_own", {
      for: "select",
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
    }),
    pgPolicy("notifications_update_own", {
      for: "update",
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
      withCheck: sql`${table.userId} = ${authUid}`,
    }),
  ],
);

export const pushSubscriptions = pgTable(
  "push_subscriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    endpoint: text("endpoint").notNull(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("push_subscriptions_endpoint_key").on(table.endpoint),
    index("idx_push_subscriptions_user_id").on(table.userId),
    pgPolicy("push_subscriptions_select", {
      for: "select",
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
    }),
    pgPolicy("push_subscriptions_insert", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${table.userId} = ${authUid}`,
    }),
    pgPolicy("push_subscriptions_delete", {
      for: "delete",
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
    }),
  ],
);

export const adminAuditLog = pgTable(
  "admin_audit_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    adminUserId: uuid("admin_user_id").notNull(),
    action: adminActionEnum("action").notNull(),
    targetType: text("target_type"),
    targetId: uuid("target_id"),
    reason: text("reason").notNull(),
    metadata: jsonb("metadata").default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_admin_audit_log_created_at").on(table.createdAt),
    // Defense-in-depth: admin-only insert/select via RLS
    // Admin actions use db directly (postgres role), so these policies
    // only guard against unexpected authenticated (non-admin) access
    pgPolicy("admin_audit_log_insert", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`exists(select 1 from "user" where "user".id = ${authUid} and "user".role = 'admin')`,
    }),
    pgPolicy("admin_audit_log_select", {
      for: "select",
      to: authenticatedRole,
      using: sql`exists(select 1 from "user" where "user".id = ${authUid} and "user".role = 'admin')`,
    }),
    // No UPDATE or DELETE policies — audit log is immutable
  ],
);
