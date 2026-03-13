"use server";

import { db, createDrizzleSupabaseClient } from "@/lib/db";
import { applications, blocks, houseMembers, houses, rooms } from "@/lib/db/schema";
import { ApplicationStatus } from "@openhospi/shared/enums";
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth/server";

const REJECTABLE_STATUSES = [
  ApplicationStatus.sent,
  ApplicationStatus.seen,
  ApplicationStatus.liked,
  ApplicationStatus.maybe,
] as const;

export async function blockUser(blockedId: string) {
  const session = await requireSession();
  const userId = session.user.id;

  if (userId === blockedId) throw new Error("Cannot block yourself");

  await createDrizzleSupabaseClient(userId).rls(async (tx) => {
    await tx.insert(blocks).values({ blockerId: userId, blockedId }).onConflictDoNothing();
  });

  // Cascade: auto-reject pending applications from blocked user to blocker's rooms
  // Use db directly since we need cross-table access beyond RLS scope
  const blockerRooms = await db
    .select({ roomId: rooms.id })
    .from(rooms)
    .innerJoin(houses, eq(rooms.houseId, houses.id))
    .innerJoin(houseMembers, eq(houseMembers.houseId, houses.id))
    .where(eq(houseMembers.userId, userId));

  const roomIds = blockerRooms.map((r) => r.roomId);

  if (roomIds.length > 0) {
    await db
      .update(applications)
      .set({ status: ApplicationStatus.rejected })
      .where(
        and(
          eq(applications.userId, blockedId),
          inArray(applications.roomId, roomIds),
          inArray(applications.status, [...REJECTABLE_STATUSES]),
        ),
      );
  }

  revalidatePath("/chat");
  revalidatePath("/discover");
}

export async function unblockUser(blockedId: string) {
  const session = await requireSession();
  const userId = session.user.id;

  await createDrizzleSupabaseClient(userId).rls(async (tx) => {
    await tx
      .delete(blocks)
      .where(and(eq(blocks.blockerId, userId), eq(blocks.blockedId, blockedId)));
  });

  revalidatePath("/chat");
  revalidatePath("/discover");
}

export async function getBlockedUsers(): Promise<string[]> {
  const session = await requireSession();
  const userId = session.user.id;

  const result = await createDrizzleSupabaseClient(userId).rls(async (tx) => {
    return tx
      .select({ blockedId: blocks.blockedId })
      .from(blocks)
      .where(eq(blocks.blockerId, userId));
  });

  return result.map((r) => r.blockedId);
}

export async function isBlocked(userId: string, otherUserId: string): Promise<boolean> {
  const [row] = await db
    .select({ blockerId: blocks.blockerId })
    .from(blocks)
    .where(inArray(blocks.blockerId, [userId, otherUserId]))
    .limit(1);

  // Check bidirectional: either userId blocked otherUserId OR otherUserId blocked userId
  if (!row) return false;

  const results = await db
    .select({ blockerId: blocks.blockerId, blockedId: blocks.blockedId })
    .from(blocks)
    .where(
      and(
        inArray(blocks.blockerId, [userId, otherUserId]),
        inArray(blocks.blockedId, [userId, otherUserId]),
      ),
    );

  return results.length > 0;
}
