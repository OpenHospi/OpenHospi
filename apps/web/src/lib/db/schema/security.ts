import { sql } from "drizzle-orm";
import { index, pgPolicy, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { authUid, authenticatedRole } from "drizzle-orm/supabase";

import { messages } from "./chat";
import { reportReasonEnum, reportStatusEnum, reportTypeEnum } from "./enums";
import { profiles } from "./profiles";
import { rooms } from "./rooms";

// ── Reports ──

export const reports = pgTable(
  "reports",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    reportType: reportTypeEnum("report_type").notNull(),
    reporterId: uuid("reporter_id").references(() => profiles.id, { onDelete: "set null" }),
    reportedUserId: uuid("reported_user_id").references(() => profiles.id, {
      onDelete: "set null",
    }),
    reportedRoomId: uuid("reported_room_id").references(() => rooms.id, { onDelete: "set null" }),
    reportedMessageId: uuid("reported_message_id").references(() => messages.id, {
      onDelete: "set null",
    }),
    reason: reportReasonEnum("reason").notNull(),
    description: text("description"),
    // Voluntarily submitted by the reporter — admins never decrypt messages themselves
    decryptedMessageText: text("decrypted_message_text"),
    status: reportStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    resolvedBy: uuid("resolved_by"),
  },
  (table) => [
    index("idx_reports_type_status_date").on(table.reportType, table.status, table.createdAt),
    index("idx_reports_status").on(table.status),
    index("idx_reports_created_at").on(table.createdAt),
    pgPolicy("reports_insert_own", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${table.reporterId} = ${authUid}`,
    }),
    pgPolicy("reports_select_own", {
      for: "select",
      to: authenticatedRole,
      using: sql`${table.reporterId} = ${authUid}`,
    }),
    pgPolicy("reports_select_admin", {
      for: "select",
      to: authenticatedRole,
      using: sql`exists(select 1 from "user" where "user".id = ${authUid} and "user".role = 'admin')`,
    }),
    pgPolicy("reports_update_admin", {
      for: "update",
      to: authenticatedRole,
      using: sql`exists(select 1 from "user" where "user".id = ${authUid} and "user".role = 'admin')`,
    }),
  ],
);

// ── Blocks ──

export const blocks = pgTable(
  "blocks",
  {
    blockerId: uuid("blocker_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    blockedId: uuid("blocked_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.blockerId, table.blockedId] }),
    index("idx_blocks_blocked_id").on(table.blockedId),
    pgPolicy("blocks_select", {
      for: "select",
      to: authenticatedRole,
      using: sql`${table.blockerId} = ${authUid}`,
    }),
    pgPolicy("blocks_insert", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${table.blockerId} = ${authUid}`,
    }),
    pgPolicy("blocks_update", {
      for: "update",
      to: authenticatedRole,
      using: sql`${table.blockerId} = ${authUid}`,
      withCheck: sql`${table.blockerId} = ${authUid}`,
    }),
    pgPolicy("blocks_delete", {
      for: "delete",
      to: authenticatedRole,
      using: sql`${table.blockerId} = ${authUid}`,
    }),
  ],
);
