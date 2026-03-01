import { sql } from "drizzle-orm";
import { authUid, authenticatedRole } from "drizzle-orm/supabase";
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

import {
  consentPurposeEnum,
  dataRequestStatusEnum,
  dataRequestTypeEnum,
  legalBasisEnum,
} from "./enums";
import { profiles } from "./profiles";

// Immutable audit log of all consent changes
export const consentRecords = pgTable(
  "consent_records",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    purpose: consentPurposeEnum("purpose").notNull(),
    granted: boolean("granted").notNull(),
    legalBasis: legalBasisEnum("legal_basis").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    version: text("version").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_consent_records_user").on(table.userId),
    index("idx_consent_records_user_purpose").on(table.userId, table.purpose),
    pgPolicy("consent_records_select_own", {
      for: "select",
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
    }),
    pgPolicy("consent_records_insert_own", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${table.userId} = ${authUid}`,
    }),
    // No UPDATE or DELETE — immutable audit trail
  ],
);

// Current consent state for fast lookups
export const activeConsents = pgTable(
  "active_consents",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    purpose: consentPurposeEnum("purpose").notNull(),
    granted: boolean("granted").notNull(),
    lastUpdatedAt: timestamp("last_updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.purpose] }),
    pgPolicy("active_consents_select_own", {
      for: "select",
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
    }),
    pgPolicy("active_consents_insert_own", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${table.userId} = ${authUid}`,
    }),
    pgPolicy("active_consents_update_own", {
      for: "update",
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
      withCheck: sql`${table.userId} = ${authUid}`,
    }),
  ],
);

// Formal GDPR data subject requests
export const dataRequests = pgTable(
  "data_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    type: dataRequestTypeEnum("type").notNull(),
    status: dataRequestStatusEnum("status").notNull().default("pending"),
    description: text("description"),
    adminNotes: text("admin_notes"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    completedBy: uuid("completed_by"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (table) => [
    index("idx_data_requests_user").on(table.userId),
    index("idx_data_requests_status").on(table.status),
    pgPolicy("data_requests_select_own", {
      for: "select",
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
    }),
    pgPolicy("data_requests_insert_own", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${table.userId} = ${authUid}`,
    }),
    // Admin can see all data requests
    pgPolicy("data_requests_select_admin", {
      for: "select",
      to: authenticatedRole,
      using: sql`exists(select 1 from "user" where "user".id = ${authUid} and "user".role = 'admin')`,
    }),
    // Admin can update data requests
    pgPolicy("data_requests_update_admin", {
      for: "update",
      to: authenticatedRole,
      using: sql`exists(select 1 from "user" where "user".id = ${authUid} and "user".role = 'admin')`,
    }),
  ],
);

// Art. 18 right to restriction of processing
export const processingRestrictions = pgTable(
  "processing_restrictions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => profiles.id, { onDelete: "cascade" }),
    restrictedAt: timestamp("restricted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    reason: text("reason"),
    liftedAt: timestamp("lifted_at", { withTimezone: true }),
    liftedBy: uuid("lifted_by"),
  },
  (table) => [
    pgPolicy("processing_restrictions_select_own", {
      for: "select",
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
    }),
    pgPolicy("processing_restrictions_insert_own", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${table.userId} = ${authUid}`,
    }),
    // Admin can see and update all restrictions
    pgPolicy("processing_restrictions_select_admin", {
      for: "select",
      to: authenticatedRole,
      using: sql`exists(select 1 from "user" where "user".id = ${authUid} and "user".role = 'admin')`,
    }),
    pgPolicy("processing_restrictions_update_admin", {
      for: "update",
      to: authenticatedRole,
      using: sql`exists(select 1 from "user" where "user".id = ${authUid} and "user".role = 'admin')`,
    }),
  ],
);
