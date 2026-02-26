import { RoomStatus } from "@openhospi/shared/enums";
import { isNotNull, or, sql } from "drizzle-orm";
import { anonymousRole, authUid, authenticatedRole, crudPolicy } from "drizzle-orm/neon";
import {
  boolean,
  date,
  index,
  integer,
  numeric,
  pgPolicy,
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
  houseTypeEnum,
  languageEnum,
  lifestyleTagEnum,
  locationTagEnum,
  rentalTypeEnum,
  roomFeatureEnum,
  roomStatusEnum,
  verenigingEnum,
} from "./enums";
import { houses } from "./houses";
import { profiles } from "./profiles";

export const rooms = pgTable(
  "rooms",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: uuid("created_by")
      .notNull()
      .references(() => profiles.id),
    houseId: uuid("house_id")
      .notNull()
      .references(() => houses.id),
    title: text("title").notNull(),
    description: text("description"),
    city: cityEnum("city").notNull(),
    neighborhood: text("neighborhood"),
    address: text("address"),
    rentPrice: numeric("rent_price", { precision: 7, scale: 2 }).notNull().default("0"),
    deposit: numeric("deposit", { precision: 7, scale: 2 }),
    utilitiesIncluded: boolean("utilities_included").default(false),
    serviceCosts: numeric("service_costs", { precision: 7, scale: 2 }),
    totalCost: numeric("total_cost", { precision: 7, scale: 2 })
      .generatedAlwaysAs(sql`rent_price + COALESCE(service_costs, 0)`),
    roomSizeM2: integer("room_size_m2"),
    availableFrom: date("available_from"),
    availableUntil: date("available_until"),
    rentalType: rentalTypeEnum("rental_type").default("vast"),
    houseType: houseTypeEnum("house_type"),
    furnishing: furnishingEnum("furnishing"),
    totalHousemates: integer("total_housemates"),
    features: roomFeatureEnum("features").array().default([]),
    locationTags: locationTagEnum("location_tags").array().default([]),
    roomVereniging: verenigingEnum("room_vereniging"),
    preferredGender: genderPreferenceEnum("preferred_gender").default("geen_voorkeur"),
    preferredAgeMin: integer("preferred_age_min"),
    preferredAgeMax: integer("preferred_age_max"),
    preferredLifestyleTags: lifestyleTagEnum("preferred_lifestyle_tags")
      .array()
      .default([]),
    status: roomStatusEnum("status").notNull().default("draft"),
    shareLink: uuid("share_link").unique().defaultRandom(),
    shareLinkExpiresAt: timestamp("share_link_expires_at", { withTimezone: true }),
    shareLinkMaxUses: integer("share_link_max_uses"),
    shareLinkUseCount: integer("share_link_use_count").default(0),
    acceptedLanguages: languageEnum("accepted_languages").array().default([]),
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
      .where(isNotNull(table.roomVereniging)),
    pgPolicy("rooms_select_anon", {
      for: "select",
      to: anonymousRole,
      using: sql`${table.status} = '${sql.raw(RoomStatus.active)}'`,
    }),
    pgPolicy("rooms_select_auth", {
      for: "select",
      to: authenticatedRole,
      using: or(
        sql`${table.status} = '${sql.raw(RoomStatus.active)}'`,
        authUid(table.ownerId)
      ),
    }),
    pgPolicy("rooms_insert_own", {
      for: "insert",
      to: authenticatedRole,
      withCheck: authUid(table.ownerId),
    }),
    pgPolicy("rooms_update_own", {
      for: "update",
      to: authenticatedRole,
      using: authUid(table.ownerId),
      withCheck: authUid(table.ownerId),
    }),
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
  (table) => [
    unique("room_photos_room_id_slot_key").on(table.roomId, table.slot),
    // Anonymous: can see photos of active rooms
    pgPolicy("room_photos_select_anon", {
      for: "select",
      to: anonymousRole,
      using: sql`exists(select 1 from rooms where rooms.id = ${table.roomId} and rooms.status = '${sql.raw(RoomStatus.active)}')`,
    }),
    // Authenticated: can see all room photos (rooms RLS already limits room visibility)
    crudPolicy({
      role: authenticatedRole,
      read: true,
      modify: sql`exists(select 1 from rooms where rooms.id = ${table.roomId} and rooms.created_by = (select auth.user_id()))`,
    }),
  ],
);
