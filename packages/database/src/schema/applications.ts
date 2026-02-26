import { sql } from "drizzle-orm";
import { authUid, authenticatedRole } from "drizzle-orm/neon";
import { index, pgPolicy, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";

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
      .references(() => profiles.id),
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
    // Applicant sees own + housemates see applications for their rooms
    pgPolicy("applications_select", {
      for: "select",
      to: authenticatedRole,
      using: sql`(select auth.user_id()) = ${table.userId} or exists(select 1 from room_members_rls where room_members_rls.room_id = ${table.roomId} and room_members_rls.user_id = (select auth.user_id()))`,
    }),
    // Only applicant can create
    pgPolicy("applications_insert", {
      for: "insert",
      to: authenticatedRole,
      withCheck: authUid(table.userId),
    }),
    // Applicant can update own (withdraw), housemates owner/admin can update status
    pgPolicy("applications_update", {
      for: "update",
      to: authenticatedRole,
      using: sql`(select auth.user_id()) = ${table.userId} or exists(select 1 from room_members_rls where room_members_rls.room_id = ${table.roomId} and room_members_rls.user_id = (select auth.user_id()) and room_members_rls.role in ('owner', 'admin'))`,
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
      .references(() => profiles.id),
    applicantId: uuid("applicant_id")
      .notNull()
      .references(() => profiles.id),
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
    // All housemates of the room can see reviews
    pgPolicy("reviews_select", {
      for: "select",
      to: authenticatedRole,
      using: sql`exists(select 1 from room_members_rls where room_members_rls.room_id = ${table.roomId} and room_members_rls.user_id = (select auth.user_id()))`,
    }),
    // Housemates can insert their own reviews
    pgPolicy("reviews_insert", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${authUid(table.reviewerId)} and exists(select 1 from room_members_rls where room_members_rls.room_id = ${table.roomId} and room_members_rls.user_id = (select auth.user_id()))`,
    }),
    // Reviewer can update their own review
    pgPolicy("reviews_update", {
      for: "update",
      to: authenticatedRole,
      using: authUid(table.reviewerId),
    }),
  ],
);
