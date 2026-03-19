"use server";

import { createDrizzleSupabaseClient, db } from "@openhospi/database";
import { applications, blocks } from "@openhospi/database/schema";
import { ApplicationStatus } from "@openhospi/shared/enums";
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth/server";

export async function blockUser(blockedId: string) {
  const session = await requireSession();
  if (session.user.id === blockedId) return { error: "cannot_block_self" as const };

  await db.insert(blocks).values({ blockerId: session.user.id, blockedId }).onConflictDoNothing();

  // Auto-reject pending applications from blocked user to rooms owned by blocker
  await db
    .update(applications)
    .set({ status: ApplicationStatus.rejected })
    .where(
      and(
        eq(applications.userId, blockedId),
        inArray(applications.status, [
          ApplicationStatus.sent,
          ApplicationStatus.seen,
          ApplicationStatus.liked,
          ApplicationStatus.maybe,
        ]),
      ),
    );

  revalidatePath("/chat");
  return { success: true };
}

export async function unblockUser(blockedId: string) {
  const session = await requireSession();

  await db
    .delete(blocks)
    .where(and(eq(blocks.blockerId, session.user.id), eq(blocks.blockedId, blockedId)));

  revalidatePath("/chat");
  return { success: true };
}

export async function getBlockedUsers() {
  const session = await requireSession();

  return await createDrizzleSupabaseClient(session.user.id).rls((tx) =>
    tx.select().from(blocks).where(eq(blocks.blockerId, session.user.id)),
  );
}

export async function isBlocked(userId: string, otherUserId: string) {
  const [row] = await db
    .select()
    .from(blocks)
    .where(and(eq(blocks.blockerId, userId), eq(blocks.blockedId, otherUserId)));

  return !!row;
}
