import { sql } from "drizzle-orm";
import { authUid, authenticatedRole, crudPolicy } from "drizzle-orm/neon";
import {
  index,
  jsonb,
  pgPolicy,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { messages } from "./chat";
import { reportReasonEnum, reportStatusEnum } from "./enums";
import { profiles } from "./profiles";
import { rooms } from "./rooms";

export const publicKeys = pgTable(
  "public_keys",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => profiles.id),
    publicKeyJwk: jsonb("public_key_jwk").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    rotatedAt: timestamp("rotated_at", { withTimezone: true }),
  },
  (table) => [
    crudPolicy({
      role: authenticatedRole,
      read: sql`true`,
      modify: authUid(table.userId),
    }),
  ],
);

export const privateKeyBackups = pgTable(
  "private_key_backups",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => profiles.id),
    encryptedPrivateKey: text("encrypted_private_key").notNull(),
    backupIv: text("backup_iv").notNull(),
    backupKey: text("backup_key").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    crudPolicy({
      role: authenticatedRole,
      read: authUid(table.userId),
      modify: authUid(table.userId),
    }),
  ],
);

export const reports = pgTable(
  "reports",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    reporterId: uuid("reporter_id")
      .notNull()
      .references(() => profiles.id),
    reportedUserId: uuid("reported_user_id").references(() => profiles.id),
    reportedRoomId: uuid("reported_room_id").references(() => rooms.id),
    reportedMessageId: uuid("reported_message_id").references(() => messages.id),
    reason: reportReasonEnum("reason").notNull(),
    description: text("description"),
    decryptedMessageText: text("decrypted_message_text"),
    status: reportStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    resolvedBy: uuid("resolved_by"),
  },
  (table) => [
    index("idx_reports_status").on(table.status),
    // Only own reports: insert and read
    pgPolicy("reports_insert_own", {
      for: "insert",
      to: authenticatedRole,
      withCheck: authUid(table.reporterId),
    }),
    pgPolicy("reports_select_own", {
      for: "select",
      to: authenticatedRole,
      using: authUid(table.reporterId),
    }),
  ],
);

export const blocks = pgTable(
  "blocks",
  {
    blockerId: uuid("blocker_id")
      .notNull()
      .references(() => profiles.id),
    blockedId: uuid("blocked_id")
      .notNull()
      .references(() => profiles.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.blockerId, table.blockedId] }),
    index("idx_blocks_blocked_id").on(table.blockedId),
    crudPolicy({
      role: authenticatedRole,
      read: authUid(table.blockerId),
      modify: authUid(table.blockerId),
    }),
  ],
);
