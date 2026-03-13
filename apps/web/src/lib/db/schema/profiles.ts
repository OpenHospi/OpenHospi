import { isNotNull, sql } from "drizzle-orm";
import {
  date,
  index,
  jsonb,
  pgPolicy,
  pgTable,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { authUid, authenticatedRole } from "drizzle-orm/supabase";

import { user } from "./auth-schema";
import {
  cityEnum,
  genderEnum,
  languageEnum,
  lifestyleTagEnum,
  localeEnum,
  studyLevelEnum,
  verenigingEnum,
} from "./enums";

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id")
      .primaryKey()
      .references(() => user.id),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email").notNull(),
    institutionDomain: text("institution_domain").notNull(),
    avatarUrl: text("avatar_url"),
    birthDate: date("birth_date"),
    gender: genderEnum("gender"),
    bio: text("bio"),
    studyProgram: text("study_program"),
    studyLevel: studyLevelEnum("study_level"),
    vereniging: verenigingEnum("vereniging"),
    preferredCity: cityEnum("preferred_city"),
    lifestyleTags: lifestyleTagEnum("lifestyle_tags").array().default([]),
    languages: languageEnum("languages").array().default([]),
    preferredLocale: localeEnum("preferred_locale").default("nl"),
    notificationPreferences: jsonb("notification_preferences"),
    privacyPolicyAcceptedVersion: text("privacy_policy_accepted_version"),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (table) => [
    index("idx_profiles_vereniging")
      .on(table.id, table.vereniging)
      .where(isNotNull(table.vereniging)),
    pgPolicy("profiles_select", {
      for: "select",
      to: authenticatedRole,
      using: sql`true`,
    }),
    pgPolicy("profiles_update_own", {
      for: "update",
      to: authenticatedRole,
      using: sql`${table.id} = ${authUid}`,
      withCheck: sql`${table.id} = ${authUid}`,
    }),
  ],
);

export const profilePhotos = pgTable(
  "profile_photos",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    slot: smallint("slot").notNull(),
    url: text("url").notNull(),
    caption: text("caption"),
    uploadedAt: timestamp("uploaded_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    unique("profile_photos_user_id_slot_key").on(table.userId, table.slot),
    index("idx_profile_photos_user").on(table.userId),
    pgPolicy("profile_photos_select", {
      for: "select",
      to: authenticatedRole,
      using: sql`true`,
    }),
    pgPolicy("profile_photos_insert", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${table.userId} = ${authUid}`,
    }),
    pgPolicy("profile_photos_update", {
      for: "update",
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
      withCheck: sql`${table.userId} = ${authUid}`,
    }),
    pgPolicy("profile_photos_delete", {
      for: "delete",
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
    }),
  ],
);

/**
 * Separate table for calendar subscription tokens.
 * Strict per-user RLS — only the owner can read their own token.
 * This prevents the token from being exposed via the open profiles_select policy.
 */
export const calendarTokens = pgTable(
  "calendar_tokens",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => profiles.id, { onDelete: "cascade" }),
    token: uuid("token").notNull().defaultRandom().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_calendar_tokens_token").on(table.token),
    pgPolicy("calendar_tokens_select_own", {
      for: "select",
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
    }),
    pgPolicy("calendar_tokens_insert_own", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${table.userId} = ${authUid}`,
    }),
    pgPolicy("calendar_tokens_update_own", {
      for: "update",
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
      withCheck: sql`${table.userId} = ${authUid}`,
    }),
    pgPolicy("calendar_tokens_delete_own", {
      for: "delete",
      to: authenticatedRole,
      using: sql`${table.userId} = ${authUid}`,
    }),
  ],
);
