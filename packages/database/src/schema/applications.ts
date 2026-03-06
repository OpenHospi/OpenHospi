import { HouseMemberRole } from "@openhospi/shared/enums";
import { sql } from "drizzle-orm";
import { index, pgPolicy, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { authUid, authenticatedRole } from "drizzle-orm/supabase";

import { applicationStatusEnum, reviewDecisionEnum } from "./enums";
import { profiles } from "./profiles";
import { rooms } from "./rooms";

export const applications = pgTable(
  "applications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    roomId: uuid("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    personalMessage: text("personal_message"),
    status: applicationStatusEnum("status").notNull().default("sent"),
    appliedAt: timestamp("applied_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (table) => [
    unique("applications_room_id_user_id_key").on(table.roomId, table.userId),
    index("idx_applications_user_id").on(table.userId),
    index("idx_applications_room_id_status").on(table.roomId, table.status),
    pgPolicy("applications_select", {
      for: "select",
      to: authenticatedRole,
      using: sql`(select auth.uid()) = ${table.userId} or exists(select 1 from room_members_rls where room_members_rls.room_id = ${table.roomId} and room_members_rls.user_id = (select auth.uid()))`,
    }),
    pgPolicy("applications_insert", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${table.userId} = ${authUid}`,
    }),
    pgPolicy("applications_update", {
      for: "update",
      to: authenticatedRole,
      using: sql`(select auth.uid()) = ${table.userId} or exists(select 1 from room_members_rls where room_members_rls.room_id = ${table.roomId} and room_members_rls.user_id = (select auth.uid()) and room_members_rls.role = '${sql.raw(HouseMemberRole.owner)}')`,
    }),
  ],
);

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    roomId: uuid("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    reviewerId: uuid("reviewer_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    applicantId: uuid("applicant_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    decision: reviewDecisionEnum("decision").notNull(),
    notes: text("notes"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("reviews_room_id_reviewer_id_applicant_id_key").on(
      table.roomId,
      table.reviewerId,
      table.applicantId,
    ),
    pgPolicy("reviews_select", {
      for: "select",
      to: authenticatedRole,
      using: sql`exists(select 1 from room_members_rls where room_members_rls.room_id = ${table.roomId} and room_members_rls.user_id = (select auth.uid()))`,
    }),
    pgPolicy("reviews_insert", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${table.reviewerId} = ${authUid} and exists(select 1 from room_members_rls where room_members_rls.room_id = ${table.roomId} and room_members_rls.user_id = (select auth.uid()))`,
    }),
    pgPolicy("reviews_update", {
      for: "update",
      to: authenticatedRole,
      using: sql`${table.reviewerId} = ${authUid}`,
    }),
  ],
);

export const applicationStatusHistory = pgTable(
  "application_status_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    fromStatus: applicationStatusEnum("from_status"),
    toStatus: applicationStatusEnum("to_status").notNull(),
    changedAt: timestamp("changed_at", { withTimezone: true }).notNull().defaultNow(),
    changedBy: uuid("changed_by").references(() => profiles.id, { onDelete: "set null" }),
  },
  (table) => [
    index("idx_app_status_history_app_id").on(table.applicationId),
    pgPolicy("app_status_history_select", {
      for: "select",
      to: authenticatedRole,
      using: sql`exists(select 1 from applications where applications.id = ${table.applicationId} and (applications.user_id = (select auth.uid()) or exists(select 1 from room_members_rls where room_members_rls.room_id = applications.room_id and room_members_rls.user_id = (select auth.uid()))))`,
    }),
    pgPolicy("app_status_history_insert", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`exists(select 1 from applications where applications.id = ${table.applicationId} and (applications.user_id = (select auth.uid()) or exists(select 1 from room_members_rls where room_members_rls.room_id = applications.room_id and room_members_rls.user_id = (select auth.uid()))))`,
    }),
  ],
);
