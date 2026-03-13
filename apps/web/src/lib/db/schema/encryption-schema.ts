import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { authUid, authenticatedRole } from "drizzle-orm/supabase";

import { user } from "./auth-schema";
import { platformEnum } from "./enums";

// ── Devices (per-user, per-platform) ──

export const devices = pgTable(
  "devices",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    deviceId: integer("device_id").notNull(), // per-user device number
    registrationId: integer("registration_id").notNull(), // random uint32
    identityKeyPublic: text("identity_key_public").notNull(), // base64 Curve25519
    platform: platformEnum("platform").notNull(),
    pushToken: text("push_token"),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("devices_user_id_device_id_key").on(table.userId, table.deviceId),
    index("idx_devices_user_id").on(table.userId),
    pgPolicy("devices_select", {
      for: "select",
      to: authenticatedRole,
      using: sql`true`,
    }),
    pgPolicy("devices_insert", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${table.userId} = ${authUid}`,
    }),
    pgPolicy("devices_update", {
      for: "update",
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
      withCheck: sql`${table.userId} = ${authUid}`,
    }),
    pgPolicy("devices_delete", {
      for: "delete",
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
    }),
  ],
);

// ── Signed Pre-Keys (per-device) ──

export const signedPreKeys = pgTable(
  "signed_pre_keys",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    deviceId: uuid("device_id")
      .notNull()
      .references(() => devices.id, { onDelete: "cascade" }),
    keyId: integer("key_id").notNull(),
    publicKey: text("public_key").notNull(), // base64 X25519
    signature: text("signature").notNull(), // base64 Ed25519
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("signed_pre_keys_device_id_key_id_key").on(table.deviceId, table.keyId),
    pgPolicy("signed_pre_keys_select", {
      for: "select",
      to: authenticatedRole,
      using: sql`true`,
    }),
    pgPolicy("signed_pre_keys_insert", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`exists(select 1 from devices d where d.id = ${table.deviceId} and d.user_id = (select auth.uid()))`,
    }),
    pgPolicy("signed_pre_keys_update", {
      for: "update",
      to: authenticatedRole,
      using: sql`exists(select 1 from devices d where d.id = ${table.deviceId} and d.user_id = (select auth.uid()))`,
      withCheck: sql`exists(select 1 from devices d where d.id = ${table.deviceId} and d.user_id = (select auth.uid()))`,
    }),
    pgPolicy("signed_pre_keys_delete", {
      for: "delete",
      to: authenticatedRole,
      using: sql`exists(select 1 from devices d where d.id = ${table.deviceId} and d.user_id = (select auth.uid()))`,
    }),
  ],
);

// ── One-Time Pre-Keys (per-device) ──

export const oneTimePreKeys = pgTable(
  "one_time_pre_keys",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    deviceId: uuid("device_id")
      .notNull()
      .references(() => devices.id, { onDelete: "cascade" }),
    keyId: integer("key_id").notNull(),
    publicKey: text("public_key").notNull(), // base64 X25519
    used: boolean("used").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("one_time_pre_keys_device_id_key_id_key").on(table.deviceId, table.keyId),
    index("idx_one_time_pre_keys_device").on(table.deviceId),
    pgPolicy("one_time_pre_keys_select", {
      for: "select",
      to: authenticatedRole,
      using: sql`true`,
    }),
    pgPolicy("one_time_pre_keys_insert", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`exists(select 1 from devices d where d.id = ${table.deviceId} and d.user_id = (select auth.uid()))`,
    }),
    pgPolicy("one_time_pre_keys_delete", {
      for: "delete",
      to: authenticatedRole,
      using: sql`exists(select 1 from devices d where d.id = ${table.deviceId} and d.user_id = (select auth.uid()))`,
    }),
  ],
);

// ── Private Key Backups (kept — repurposed for identity key backup) ──

export const privateKeyBackups = pgTable(
  "private_key_backups",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => user.id, { onDelete: "cascade" }),
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
