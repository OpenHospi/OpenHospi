import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  numeric,
  pgTable,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import {
  cityEnum,
  furnishingEnum,
  genderPreferenceEnum,
  housemateRoleEnum,
  houseTypeEnum,
  languageEnum,
  lifestyleTagEnum,
  locationTagEnum,
  rentalTypeEnum,
  roomFeatureEnum,
  roomStatusEnum,
  verenigingEnum,
} from "./enums";
import { profiles } from "./profiles";

export const rooms = pgTable(
  "rooms",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: uuid("created_by")
      .notNull()
      .references(() => profiles.id),
    title: text("title").notNull(),
    description: text("description"),
    city: cityEnum("city").notNull(),
    neighborhood: text("neighborhood"),
    address: text("address"),
    rentPrice: numeric("rent_price", { precision: 7, scale: 2 }).notNull().default("0"),
    deposit: numeric("deposit", { precision: 7, scale: 2 }),
    utilitiesIncluded: boolean("utilities_included").default(false),
    roomSizeM2: integer("room_size_m2"),
    availableFrom: date("available_from"),
    availableUntil: date("available_until"),
    rentalType: rentalTypeEnum("rental_type").default("vast"),
    houseType: houseTypeEnum("house_type"),
    furnishing: furnishingEnum("furnishing"),
    totalHousemates: integer("total_housemates"),
    features: roomFeatureEnum("features").array().default(sql`'{}'`),
    locationTags: locationTagEnum("location_tags").array().default(sql`'{}'`),
    roomVereniging: verenigingEnum("room_vereniging"),
    preferredGender: genderPreferenceEnum("preferred_gender").default("geen_voorkeur"),
    preferredAgeMin: integer("preferred_age_min"),
    preferredAgeMax: integer("preferred_age_max"),
    preferredLifestyleTags: lifestyleTagEnum("preferred_lifestyle_tags")
      .array()
      .default(sql`'{}'`),
    status: roomStatusEnum("status").notNull().default("draft"),
    shareLink: text("share_link").unique().default(sql`gen_random_uuid()::text`),
    shareLinkExpiresAt: timestamp("share_link_expires_at", { withTimezone: true }),
    shareLinkMaxUses: integer("share_link_max_uses"),
    shareLinkUseCount: integer("share_link_use_count").default(0),
    acceptedLanguages: languageEnum("accepted_languages").array().default(sql`'{}'`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (table) => [
    index("idx_rooms_city_status").on(table.city, table.status),
    index("idx_rooms_rent_price").on(table.rentPrice),
    index("idx_rooms_available_from").on(table.availableFrom),
    index("idx_rooms_vereniging")
      .on(table.roomVereniging)
      .where(sql`room_vereniging IS NOT NULL`),
  ],
);

export const roomPhotos = pgTable(
  "room_photos",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    roomId: uuid("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    slot: smallint("slot").notNull(),
    url: text("url").notNull(),
    caption: text("caption"),
    uploadedAt: timestamp("uploaded_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [unique("room_photos_room_id_slot_key").on(table.roomId, table.slot)],
);

export const housemates = pgTable(
  "housemates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    roomId: uuid("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id),
    role: housemateRoleEnum("role").default("member"),
    joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    unique("housemates_room_id_user_id_key").on(table.roomId, table.userId),
    index("idx_housemates_user_id").on(table.userId),
    index("idx_housemates_room_id").on(table.roomId),
  ],
);
