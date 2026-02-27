"use server";

import { withRLS } from "@openhospi/database";
import { blocks } from "@openhospi/database/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth-server";

export async function blockUser(blockedId: string) {
  const session = await requireSession();
  const userId = session.user.id;

  if (userId === blockedId) throw new Error("Cannot block yourself");

  await withRLS(userId, async (tx) => {
    await tx
      .insert(blocks)
      .values({ blockerId: userId, blockedId })
      .onConflictDoNothing();
  });

  revalidatePath("/chat");
}

export async function unblockUser(blockedId: string) {
  const session = await requireSession();
  const userId = session.user.id;

  await withRLS(userId, async (tx) => {
    await tx
      .delete(blocks)
      .where(and(eq(blocks.blockerId, userId), eq(blocks.blockedId, blockedId)));
  });

  revalidatePath("/chat");
}

export async function getBlockedUsers(): Promise<string[]> {
  const session = await requireSession();
  const userId = session.user.id;

  const result = await withRLS(userId, async (tx) => {
    return tx
      .select({ blockedId: blocks.blockedId })
      .from(blocks)
      .where(eq(blocks.blockerId, userId));
  });

  return result.map((r) => r.blockedId);
}
