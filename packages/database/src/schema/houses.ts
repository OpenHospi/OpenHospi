import { or, sql } from "drizzle-orm";
import { authUid, authenticatedRole } from "drizzle-orm/neon";
import { index, pgPolicy, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";

import { houseMemberRoleEnum } from "./enums";
import { profiles } from "./profiles";

export const houses = pgTable(
  "houses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    inviteCode: uuid("invite_code").unique().defaultRandom(),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => profiles.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (table) => [
    pgPolicy("houses_select", {
      for: "select",
      to: authenticatedRole,
      using: or(
        authUid(table.createdBy),
        sql`exists(select 1 from house_members_rls where house_members_rls.house_id = ${table.id} and house_members_rls.user_id = (select auth.user_id()))`,
      ),
    }),
    pgPolicy("houses_insert", {
      for: "insert",
      to: authenticatedRole,
      withCheck: authUid(table.createdBy),
    }),
    pgPolicy("houses_update", {
      for: "update",
      to: authenticatedRole,
      using: authUid(table.createdBy),
      withCheck: authUid(table.createdBy),
    }),
  ],
);

export const houseMembers = pgTable(
  "house_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    houseId: uuid("house_id")
      .notNull()
      .references(() => houses.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id),
    role: houseMemberRoleEnum("role").notNull().default("member"),
    joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    unique("house_members_house_id_user_id_key").on(table.houseId, table.userId),
    index("idx_house_members_user_id").on(table.userId),
    index("idx_house_members_house_id").on(table.houseId),
    pgPolicy("house_members_select", {
      for: "select",
      to: authenticatedRole,
      using: sql`exists(select 1 from house_members_rls where house_members_rls.house_id = ${table.houseId} and house_members_rls.user_id = (select auth.user_id()))`,
    }),
    pgPolicy("house_members_insert", {
      for: "insert",
      to: authenticatedRole,
      withCheck: sql`exists(select 1 from houses where houses.id = ${table.houseId} and houses.created_by = (select auth.user_id()))`,
    }),
    pgPolicy("house_members_delete", {
      for: "delete",
      to: authenticatedRole,
      using: sql`exists(select 1 from houses where houses.id = ${table.houseId} and houses.created_by = (select auth.user_id()))`,
    }),
  ],
);
