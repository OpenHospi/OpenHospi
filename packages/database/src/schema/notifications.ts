import { authUid, authenticatedRole, crudPolicy } from "drizzle-orm/neon";
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
    crudPolicy({
      role: authenticatedRole,
      read: authUid(table.userId),
      modify: authUid(table.userId),
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
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_notifications_user_id").on(table.userId, table.createdAt),
    // Own notifications: read only (server creates them via owner connection)
    pgPolicy("notifications_select_own", {
      for: "select",
      to: authenticatedRole,
      using: authUid(table.userId),
    }),
  ],
);

// Admin audit log — no RLS (admin-only, accessed via owner connection)
export const adminAuditLog = pgTable("admin_audit_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  adminUserId: uuid("admin_user_id").notNull(),
  action: adminActionEnum("action").notNull(),
  targetType: text("target_type"),
  targetId: uuid("target_id"),
  reason: text("reason").notNull(),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
