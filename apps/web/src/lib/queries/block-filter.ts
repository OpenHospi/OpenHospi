import { blocks } from "@/lib/db/schema";
import { type AnyColumn, eq, sql, type SQL } from "drizzle-orm";

/**
 * Returns a SQL subquery that selects all user IDs blocked by or blocking the current user.
 * Usage: `notInArray(someUserIdColumn, getBlockedUserIds(userId))`
 * or: `sql\`${column} NOT IN (${getBlockedUserIds(userId)})\``
 */
export function getBlockedUserIds(currentUserId: string): SQL {
  return sql`(
    SELECT ${blocks.blockedId} FROM ${blocks} WHERE ${eq(blocks.blockerId, currentUserId)}
    UNION
    SELECT ${blocks.blockerId} FROM ${blocks} WHERE ${eq(blocks.blockedId, currentUserId)}
  )`;
}

/**
 * Returns a Drizzle SQL condition: `column NOT IN (blocked user IDs)`.
 * Use this to filter out rows associated with blocked users.
 */
export function notBlockedBy(column: AnyColumn | SQL, currentUserId: string): SQL {
  return sql`${column} NOT IN ${getBlockedUserIds(currentUserId)}`;
}
