import { sql } from "drizzle-orm";
import {
  index,
  integer,
  pgPolicy,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { authUid, authenticatedRole } from "drizzle-orm/supabase";

import { messages } from "./chat";
import { reportReasonEnum, reportStatusEnum, reportTypeEnum } from "./enums";
import { profiles } from "./profiles";
import { rooms } from "./rooms";

// ── Identity Keys (replaces publicKeys) ──

export const identityKeys = pgTable(
  "identity_keys",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => profiles.id, { onDelete: "cascade" }),
    identityPublicKey: text("identity_public_key").notNull(), // base64 X25519 DH public key
    signingPublicKey: text("signing_public_key").notNull(), // base64 Ed25519 signing public key
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    rotatedAt: timestamp("rotated_at", { withTimezone: true }),
  },
  (table) => [
    pgPolicy("identity_keys_select", {
      for: "select",
      to: authenticatedRole,
      using: sql`true`,
    }),
    pgPolicy("identity_keys_insert", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${table.userId} = ${authUid}`,
    }),
    pgPolicy("identity_keys_update", {
      for: "update",
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
      withCheck: sql`${table.userId} = ${authUid}`,
    }),
    pgPolicy("identity_keys_delete", {
      for: "delete",
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
    }),
  ],
);

// ── Signed Pre-Keys ──

export const signedPreKeys = pgTable(
  "signed_pre_keys",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    keyId: integer("key_id").notNull(),
    publicKey: text("public_key").notNull(), // base64 X25519 public key
    signature: text("signature").notNull(), // base64 Ed25519 signature
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_signed_pre_keys_user_key").on(table.userId, table.keyId),
    pgPolicy("signed_pre_keys_select", {
      for: "select",
      to: authenticatedRole,
      using: sql`true`,
    }),
    pgPolicy("signed_pre_keys_insert", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${table.userId} = ${authUid}`,
    }),
    pgPolicy("signed_pre_keys_update", {
      for: "update",
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
      withCheck: sql`${table.userId} = ${authUid}`,
    }),
    pgPolicy("signed_pre_keys_delete", {
      for: "delete",
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
    }),
  ],
);

// ── One-Time Pre-Keys ──

export const oneTimePreKeys = pgTable(
  "one_time_pre_keys",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    keyId: integer("key_id").notNull(),
    publicKey: text("public_key").notNull(), // base64 X25519 public key
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_one_time_pre_keys_user").on(table.userId),
    pgPolicy("one_time_pre_keys_select", {
      for: "select",
      to: authenticatedRole,
      using: sql`true`,
    }),
    pgPolicy("one_time_pre_keys_insert", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${table.userId} = ${authUid}`,
    }),
    pgPolicy("one_time_pre_keys_delete", {
      for: "delete",
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
    }),
  ],
);

// ── Private Key Backups (kept — repurposed for identity key backup) ──

export const privateKeyBackups = pgTable(
  "private_key_backups",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => profiles.id, { onDelete: "cascade" }),
    encryptedPrivateKey: text("encrypted_private_key").notNull(),
    backupIv: text("backup_iv").notNull(),
    salt: text("salt").notNull(), // PBKDF2 salt (base64)
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    pgPolicy("private_key_backups_select", {
      for: "select",
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
    }),
    pgPolicy("private_key_backups_insert", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${table.userId} = ${authUid}`,
    }),
    pgPolicy("private_key_backups_update", {
      for: "update",
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
      withCheck: sql`${table.userId} = ${authUid}`,
    }),
    pgPolicy("private_key_backups_delete", {
      for: "delete",
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
    }),
  ],
);

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
    // Admin can see all reports (defense-in-depth; admin queries use db directly)
    pgPolicy("reports_select_admin", {
      for: "select",
      to: authenticatedRole,
      using: sql`exists(select 1 from "user" where "user".id = ${authUid} and "user".role = 'admin')`,
    }),
    // Admin can update reports (for resolving/dismissing via RLS-based access)
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
