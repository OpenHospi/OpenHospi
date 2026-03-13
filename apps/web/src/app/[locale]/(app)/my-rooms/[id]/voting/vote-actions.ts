"use server";

import { createDrizzleSupabaseClient } from "@/lib/db";
import { votes } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

import { requireHousemate, requireNotRestricted, requireSession } from "@/lib/auth/server";

export async function submitVotes(
  roomId: string,
  rankings: { applicantId: string; rank: number }[],
  round: number = 1,
) {
  const { user } = await requireSession();
  const restricted = await requireNotRestricted(user.id);
  if (restricted) throw new Error(restricted.error);

  await requireHousemate(roomId, user.id);

  await createDrizzleSupabaseClient(user.id).rls(async (tx) => {
    // Delete existing votes for this voter+room+round
    await tx
      .delete(votes)
      .where(and(eq(votes.roomId, roomId), eq(votes.voterId, user.id), eq(votes.round, round)));

    // Insert new votes
    if (rankings.length > 0) {
      await tx.insert(votes).values(
        rankings.map((r) => ({
          roomId,
          voterId: user.id,
          applicantId: r.applicantId,
          rank: r.rank,
          round,
        })),
      );
    }
  });
}
