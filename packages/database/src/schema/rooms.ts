import { GenderPreference, RentalType, RoomStatus, UtilitiesIncluded } from "@openhospi/shared/enums";
import { isNotNull, or, sql } from "drizzle-orm";
import { anonRole, authUid, authenticatedRole } from "drizzle-orm/supabase";
import {
  date,
  doublePrecision,
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

  locationTagEnum,
  rentalTypeEnum,
  roomFeatureEnum,
  roomStatusEnum,
  utilitiesIncludedEnum,
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
    streetName: text("street_name"),
    houseNumber: text("house_number"),
    postalCode: text("postal_code"),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    rentPrice: numeric("rent_price", { precision: 7, scale: 2 }).notNull().default("0"),
    deposit: numeric("deposit", { precision: 7, scale: 2 }),
    utilitiesIncluded: utilitiesIncludedEnum("utilities_included").default(UtilitiesIncluded.included),
    serviceCosts: numeric("service_costs", { precision: 7, scale: 2 }),
    estimatedUtilitiesCosts: numeric("estimated_utilities_costs", { precision: 7, scale: 2 }),
    totalCost: numeric("total_cost", { precision: 7, scale: 2 })
      .generatedAlwaysAs(sql`rent_price + COALESCE(service_costs, 0) + COALESCE(estimated_utilities_costs, 0)`),
    roomSizeM2: integer("room_size_m2"),
    availableFrom: date("available_from"),
    availableUntil: date("available_until"),
    rentalType: rentalTypeEnum("rental_type").default(RentalType.permanent),
    houseType: houseTypeEnum("house_type"),
    furnishing: furnishingEnum("furnishing"),
    totalHousemates: integer("total_housemates"),
    features: roomFeatureEnum("features").array().default([]),
    locationTags: locationTagEnum("location_tags").array().default([]),
    roomVereniging: verenigingEnum("room_vereniging"),
    preferredGender: genderPreferenceEnum("preferred_gender").default(GenderPreference.no_preference),
    preferredAgeMin: integer("preferred_age_min"),
    preferredAgeMax: integer("preferred_age_max"),
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
      to: anonRole,
      using: sql`${table.status} = '${sql.raw(RoomStatus.active)}'`,
    }),
    pgPolicy("rooms_select_auth", {
      for: "select",
      to: authenticatedRole,
      using: or(
        sql`${table.status} = '${sql.raw(RoomStatus.active)}'`,
        sql`${table.ownerId} = ${authUid}`,
      ),
    }),
    pgPolicy("rooms_insert_own", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`${table.ownerId} = ${authUid}`,
    }),
    pgPolicy("rooms_update_own", {
      for: "update",
      to: authenticatedRole,
      using: sql`${table.ownerId} = ${authUid}`,
      withCheck: sql`${table.ownerId} = ${authUid}`,
    }),
    pgPolicy("rooms_delete_own", {
      for: "delete",
      to: authenticatedRole,
      using: sql`${table.ownerId} = ${authUid}`,
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
    pgPolicy("room_photos_select_anon", {
      for: "select",
      to: anonRole,
      using: sql`exists(select 1 from rooms where rooms.id = ${table.roomId} and rooms.status = '${sql.raw(RoomStatus.active)}')`,
    }),
    pgPolicy("room_photos_select", {
      for: "select",
      to: authenticatedRole,
      using: sql`true`,
    }),
    pgPolicy("room_photos_insert", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`exists(select 1 from rooms where rooms.id = ${table.roomId} and rooms.created_by = (select auth.uid()))`,
    }),
    pgPolicy("room_photos_update", {
      for: "update",
      to: authenticatedRole,
      using: sql`exists(select 1 from rooms where rooms.id = ${table.roomId} and rooms.created_by = (select auth.uid()))`,
      withCheck: sql`exists(select 1 from rooms where rooms.id = ${table.roomId} and rooms.created_by = (select auth.uid()))`,
    }),
    pgPolicy("room_photos_delete", {
      for: "delete",
      to: authenticatedRole,
      using: sql`exists(select 1 from rooms where rooms.id = ${table.roomId} and rooms.created_by = (select auth.uid()))`,
    }),
  ],
);
