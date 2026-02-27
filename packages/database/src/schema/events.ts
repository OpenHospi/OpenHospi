import { sql } from "drizzle-orm";
import { authUid, authenticatedRole } from "drizzle-orm/neon";
import {
  date,
  index,
  integer,
  pgPolicy,
  pgTable,
  text,
  time,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import { applications } from "./applications";
import { invitationStatusEnum } from "./enums";
import { profiles } from "./profiles";
import { rooms } from "./rooms";

export const hospiEvents = pgTable(
  "hospi_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    roomId: uuid("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => profiles.id),
    title: text("title").notNull(),
    description: text("description"),
    eventDate: date("event_date").notNull(),
    timeStart: time("time_start").notNull(),
    timeEnd: time("time_end"),
    location: text("location"),
    rsvpDeadline: timestamp("rsvp_deadline", { withTimezone: true }),
    maxAttendees: integer("max_attendees"),
    notes: text("notes"),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (table) => [
    // All housemates of the room can view events (uses view to avoid recursion through housemates RLS)
    pgPolicy("hospi_events_select", {
      for: "select",
      to: authenticatedRole,
      using: sql`exists(select 1 from room_members_rls where room_members_rls.room_id = ${table.roomId} and room_members_rls.user_id = (select auth.user_id()))`,
    }),
    // Only event creator can insert
    pgPolicy("hospi_events_insert", {
      for: "insert",
      to: authenticatedRole,
      withCheck: authUid(table.createdBy),
    }),
    // Only event creator can update
    pgPolicy("hospi_events_update", {
      for: "update",
      to: authenticatedRole,
      using: authUid(table.createdBy),
      withCheck: authUid(table.createdBy),
    }),
    // Only event creator can delete
    pgPolicy("hospi_events_delete", {
      for: "delete",
      to: authenticatedRole,
      using: authUid(table.createdBy),
    }),
  ],
);

export const hospiInvitations = pgTable(
  "hospi_invitations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => hospiEvents.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id),
    applicationId: uuid("application_id").references(() => applications.id),
    status: invitationStatusEnum("status").default("pending"),
    respondedAt: timestamp("responded_at", { withTimezone: true }),
    declineReason: text("decline_reason"),
    reminderSentAt: timestamp("reminder_sent_at", { withTimezone: true }),
    invitedAt: timestamp("invited_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    unique("hospi_invitations_event_id_user_id_key").on(table.eventId, table.userId),
    index("idx_hospi_invitations_event_id").on(table.eventId),
    index("idx_hospi_invitations_user_id").on(table.userId),
    // Invitee OR event creator can view
    pgPolicy("hospi_invitations_select", {
      for: "select",
      to: authenticatedRole,
      using: sql`${table.userId} = (select auth.user_id()) or exists(select 1 from hospi_events where hospi_events.id = ${table.eventId} and hospi_events.created_by = (select auth.user_id()))`,
    }),
    // Only event creator can invite
    pgPolicy("hospi_invitations_insert", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`exists(select 1 from hospi_events where hospi_events.id = ${table.eventId} and hospi_events.created_by = (select auth.user_id()))`,
    }),
    // Invitee (RSVP) or event creator can update
    pgPolicy("hospi_invitations_update", {
      for: "update",
      to: authenticatedRole,
      using: sql`${table.userId} = (select auth.user_id()) or exists(select 1 from hospi_events where hospi_events.id = ${table.eventId} and hospi_events.created_by = (select auth.user_id()))`,
    }),
    // Only event creator can delete
    pgPolicy("hospi_invitations_delete", {
      for: "delete",
      to: authenticatedRole,
      using: sql`exists(select 1 from hospi_events where hospi_events.id = ${table.eventId} and hospi_events.created_by = (select auth.user_id()))`,
    }),
  ],
);

export const votes = pgTable(
  "votes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    roomId: uuid("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    voterId: uuid("voter_id")
      .notNull()
      .references(() => profiles.id),
    applicantId: uuid("applicant_id")
      .notNull()
      .references(() => profiles.id),
    rank: integer("rank").notNull(),
    round: integer("round").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("votes_room_id_voter_id_applicant_id_round_key").on(
      table.roomId,
      table.voterId,
      table.applicantId,
      table.round,
    ),
    // All housemates of the room can view votes (transparency)
    pgPolicy("votes_select", {
      for: "select",
      to: authenticatedRole,
      using: sql`exists(select 1 from room_members_rls where room_members_rls.room_id = ${table.roomId} and room_members_rls.user_id = (select auth.user_id()))`,
    }),
    // Only the voter can insert
    pgPolicy("votes_insert", {
      for: "insert",
      to: authenticatedRole,
      withCheck: authUid(table.voterId),
    }),
    // Only the voter can update
    pgPolicy("votes_update", {
      for: "update",
      to: authenticatedRole,
      using: authUid(table.voterId),
      withCheck: authUid(table.voterId),
    }),
    // Only the voter can delete
    pgPolicy("votes_delete", {
      for: "delete",
      to: authenticatedRole,
      using: authUid(table.voterId),
    }),
  ],
);
