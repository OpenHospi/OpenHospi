import { sql } from "drizzle-orm";
import { authUid, authenticatedRole } from "drizzle-orm/supabase";
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
      .references(() => profiles.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    description: text("description"),
    eventDate: date("event_date").notNull(),
    timeStart: time("time_start").notNull(),
    timeEnd: time("time_end"),
    location: text("location"),
    rsvpDeadline: timestamp("rsvp_deadline", { withTimezone: true }),
    maxAttendees: integer("max_attendees"),
    notes: text("notes"),
    sequence: integer("sequence").notNull().default(0),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (table) => [
    pgPolicy("hospi_events_select", {
      for: "select",
      to: authenticatedRole,
      using: sql`exists(select 1 from room_members_rls where room_members_rls.room_id = ${table.roomId} and room_members_rls.user_id = (select auth.uid())) or exists(select 1 from hospi_invitations_rls where hospi_invitations_rls.event_id = ${table.id} and hospi_invitations_rls.user_id = (select auth.uid()))`,
    }),
    pgPolicy("hospi_events_insert", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${table.createdBy} = ${authUid}`,
    }),
    pgPolicy("hospi_events_update", {
      for: "update",
      to: authenticatedRole,
      using: sql`${table.createdBy} = ${authUid}`,
      withCheck: sql`${table.createdBy} = ${authUid}`,
    }),
    pgPolicy("hospi_events_delete", {
      for: "delete",
      to: authenticatedRole,
      using: sql`${table.createdBy} = ${authUid}`,
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
      .references(() => profiles.id, { onDelete: "cascade" }),
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
    pgPolicy("hospi_invitations_select", {
      for: "select",
      to: authenticatedRole,
      using: sql`${table.userId} = (select auth.uid()) or exists(select 1 from hospi_events where hospi_events.id = ${table.eventId} and hospi_events.created_by = (select auth.uid()))`,
    }),
    pgPolicy("hospi_invitations_insert", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`exists(select 1 from hospi_events where hospi_events.id = ${table.eventId} and hospi_events.created_by = (select auth.uid()))`,
    }),
    pgPolicy("hospi_invitations_update", {
      for: "update",
      to: authenticatedRole,
      using: sql`${table.userId} = (select auth.uid()) or exists(select 1 from hospi_events where hospi_events.id = ${table.eventId} and hospi_events.created_by = (select auth.uid()))`,
    }),
    pgPolicy("hospi_invitations_delete", {
      for: "delete",
      to: authenticatedRole,
      using: sql`exists(select 1 from hospi_events where hospi_events.id = ${table.eventId} and hospi_events.created_by = (select auth.uid()))`,
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
      .references(() => profiles.id, { onDelete: "cascade" }),
    applicantId: uuid("applicant_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
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
    pgPolicy("votes_select", {
      for: "select",
      to: authenticatedRole,
      using: sql`exists(select 1 from room_members_rls where room_members_rls.room_id = ${table.roomId} and room_members_rls.user_id = (select auth.uid()))`,
    }),
    pgPolicy("votes_insert", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${table.voterId} = ${authUid}`,
    }),
    pgPolicy("votes_update", {
      for: "update",
      to: authenticatedRole,
      using: sql`${table.voterId} = ${authUid}`,
      withCheck: sql`${table.voterId} = ${authUid}`,
    }),
    pgPolicy("votes_delete", {
      for: "delete",
      to: authenticatedRole,
      using: sql`${table.voterId} = ${authUid}`,
    }),
  ],
);
