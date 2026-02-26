import { pgView } from "drizzle-orm/pg-core";

import { conversationMembers } from "./chat";
import { housemates } from "./rooms";

/**
 * Internal views used by RLS policy subqueries.
 *
 * Without `securityInvoker`, these views run as the view owner (neondb_owner)
 * which bypasses RLS — preventing infinite recursion when a policy on
 * `housemates` or `conversation_members` needs to subquery the same table.
 */

export const roomMembersRls = pgView("room_members_rls").as((qb) =>
  qb
    .select({
      roomId: housemates.roomId,
      userId: housemates.userId,
      role: housemates.role,
    })
    .from(housemates),
);

export const conversationMembersRls = pgView("conversation_members_rls").as((qb) =>
  qb
    .select({
      conversationId: conversationMembers.conversationId,
      userId: conversationMembers.userId,
    })
    .from(conversationMembers),
);
