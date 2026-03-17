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

// ── Devices ──

export const devices = pgTable(
  "devices",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    registrationId: integer("registration_id").notNull(),
    identityKeyPublic: text("identity_key_public").notNull(),
    signingKeyPublic: text("signing_key_public").notNull(),
    platform: platformEnum("platform").notNull(),
    pushToken: text("push_token"),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).defaultNow(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_devices_user_id").on(table.userId),
    // Users can see their own devices and others' public keys
    pgPolicy("devices_select_authenticated", {
      for: "select",
      to: authenticatedRole,
      using: sql`true`,
    }),
    pgPolicy("devices_insert_own", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${table.userId} = ${authUid}`,
    }),
    pgPolicy("devices_update_own", {
      for: "update",
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
    }),
    pgPolicy("devices_delete_own", {
      for: "delete",
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
    }),
  ],
);

// ── Signed Pre-Keys ──

export const signedPreKeys = pgTable(
  "signed_prekeys",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    deviceId: uuid("device_id")
      .notNull()
      .references(() => devices.id, { onDelete: "cascade" }),
    keyId: integer("key_id").notNull(),
    publicKey: text("public_key").notNull(),
    signature: text("signature").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("uq_signed_prekeys_device_key").on(table.deviceId, table.keyId),
    index("idx_signed_prekeys_device_id").on(table.deviceId),
    // Anyone can read SPKs (needed for pre-key bundles)
    pgPolicy("signed_prekeys_select_authenticated", {
      for: "select",
      to: authenticatedRole,
      using: sql`true`,
    }),
    // Only device owner can insert
    pgPolicy("signed_prekeys_insert_own", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`exists(select 1 from devices where devices.id = ${table.deviceId} and devices.user_id = ${authUid})`,
    }),
  ],
);

// ── One-Time Pre-Keys ──

export const oneTimePreKeys = pgTable(
  "one_time_prekeys",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    deviceId: uuid("device_id")
      .notNull()
      .references(() => devices.id, { onDelete: "cascade" }),
    keyId: integer("key_id").notNull(),
    publicKey: text("public_key").notNull(),
    used: boolean("used").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("uq_one_time_prekeys_device_key").on(table.deviceId, table.keyId),
    index("idx_one_time_prekeys_device_id_used").on(table.deviceId, table.used),
    // Anyone can read unused OPKs (needed for pre-key bundles)
    pgPolicy("one_time_prekeys_select_authenticated", {
      for: "select",
      to: authenticatedRole,
      using: sql`true`,
    }),
    // Only device owner can insert
    pgPolicy("one_time_prekeys_insert_own", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`exists(select 1 from devices where devices.id = ${table.deviceId} and devices.user_id = ${authUid})`,
    }),
    // Allow update (mark as used) by authenticated users (server marks used on bundle fetch)
    pgPolicy("one_time_prekeys_update_authenticated", {
      for: "update",
      to: authenticatedRole,
      using: sql`true`,
    }),
  ],
);

// ── Private Key Backups ──

export const privateKeyBackups = pgTable(
  "private_key_backups",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => user.id, { onDelete: "cascade" }),
    encryptedData: text("encrypted_data").notNull(),
    iv: text("iv").notNull(),
    salt: text("salt").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    pgPolicy("private_key_backups_select_own", {
      for: "select",
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
    }),
    pgPolicy("private_key_backups_insert_own", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${table.userId} = ${authUid}`,
    }),
    pgPolicy("private_key_backups_update_own", {
      for: "update",
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
    }),
    pgPolicy("private_key_backups_delete_own", {
      for: "delete",
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
    }),
  ],
);
