import { sql } from "drizzle-orm";
import { pgView, uuid } from "drizzle-orm/pg-core";

import { houseMemberRoleEnum } from "./enums";

/**
 * Internal views used by RLS policy subqueries.
 *
 * Without `securityInvoker`, these views run as the view owner (postgres)
 * which bypasses RLS — preventing infinite recursion when a policy on
 * `house_members` or `conversation_members` needs to subquery the same table.
 *
 * All views use explicit column definitions + raw SQL to guarantee that
 * view column names match what RLS policies reference.
 */

export const houseMembersRls = pgView("house_members_rls", {
  houseId: uuid("house_id"),
  userId: uuid("user_id"),
  role: houseMemberRoleEnum("role"),
}).as(
  sql`SELECT "house_members"."house_id", "house_members"."user_id", "house_members"."role" FROM "house_members"`,
);

export const roomMembersRls = pgView("room_members_rls", {
  roomId: uuid("room_id"),
  userId: uuid("user_id"),
  role: houseMemberRoleEnum("role"),
}).as(
  sql`SELECT "rooms"."id" AS "room_id", "house_members"."user_id", "house_members"."role" FROM "house_members" INNER JOIN "rooms" ON "rooms"."house_id" = "house_members"."house_id"`,
);

export const conversationMembersRls = pgView("conversation_members_rls", {
  conversationId: uuid("conversation_id"),
  userId: uuid("user_id"),
}).as(
  sql`SELECT "conversation_members"."conversation_id", "conversation_members"."user_id" FROM "conversation_members"`,
);
