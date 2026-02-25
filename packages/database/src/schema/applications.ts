import { authUid, authenticatedRole, crudPolicy } from "drizzle-orm/neon";
import { index, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";

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
    crudPolicy({
      role: authenticatedRole,
      read: authUid(table.userId),
      modify: authUid(table.userId),
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
    crudPolicy({
      role: authenticatedRole,
      read: authUid(table.reviewerId),
      modify: authUid(table.reviewerId),
    }),
  ],
);
