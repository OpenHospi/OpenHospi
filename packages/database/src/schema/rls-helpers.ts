import { eq, sql } from "drizzle-orm";
import { pgView } from "drizzle-orm/pg-core";

import { conversationMembers } from "./chat";
import { houseMembers } from "./houses";
import { rooms } from "./rooms";

/**
 * Internal views used by RLS policy subqueries.
 *
 * Without `securityInvoker`, these views run as the view owner (neondb_owner)
 * which bypasses RLS — preventing infinite recursion when a policy on
 * `house_members` or `conversation_members` needs to subquery the same table.
 */

export const houseMembersRls = pgView("house_members_rls").as((qb) =>
  qb
    .select({
      houseId: houseMembers.houseId,
      userId: houseMembers.userId,
      role: houseMembers.role,
    })
    .from(houseMembers),
);

export const roomMembersRls = pgView("room_members_rls").as((qb) =>
  qb
    .select({
      roomId: rooms.id,
      userId: houseMembers.userId,
      role: houseMembers.role,
    })
    .from(houseMembers)
    .innerJoin(rooms, eq(rooms.houseId, houseMembers.houseId)),
);

export const conversationMembersRls = pgView("conversation_members_rls").as((qb) =>
  qb
    .select({
      conversationId: conversationMembers.conversationId,
      userId: conversationMembers.userId,
    })
    .from(conversationMembers),
);
