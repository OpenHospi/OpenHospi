import { isNotNull, sql } from "drizzle-orm";
import { authUid, authenticatedRole, crudPolicy } from "drizzle-orm/neon";
import {
  boolean,
  date,
  index,
  jsonb,
  numeric,
  pgPolicy,
  pgTable,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import { user } from "./auth";
import {
  affiliationEnum,
  cityEnum,
  genderEnum,
  languageEnum,
  lifestyleTagEnum,
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
    affiliation: affiliationEnum("affiliation").default("student"),
    faculty: text("faculty"),
    avatarUrl: text("avatar_url"),
    birthDate: date("birth_date"),
    gender: genderEnum("gender"),
    bio: text("bio"),
    studyProgram: text("study_program"),
    studyLevel: studyLevelEnum("study_level"),
    vereniging: verenigingEnum("vereniging"),
    role: text("role").default("seeker"),
    maxRent: numeric("max_rent", { precision: 7, scale: 2 }),
    availableFrom: date("available_from"),
    preferredCity: cityEnum("preferred_city"),
    instagramHandle: text("instagram_handle"),
    showInstagram: boolean("show_instagram").default(false),
    lifestyleTags: lifestyleTagEnum("lifestyle_tags").array().default([]),
    languages: languageEnum("languages").array().default([]),
    notificationPreferences: jsonb("notification_preferences"),
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
      using: authUid(table.id),
      withCheck: authUid(table.id),
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
    crudPolicy({
      role: authenticatedRole,
      read: sql`true`,
      modify: authUid(table.userId),
    }),
  ],
);
