"use server";

import { withRLS } from "@openhospi/database";
import { votes } from "@openhospi/database/schema";
import { and, eq } from "drizzle-orm";

import { requireHousemate, requireSession } from "@/lib/auth-server";

export async function submitVotes(
  roomId: string,
  rankings: { applicantId: string; rank: number }[],
  round: number = 1,
) {
  const { user } = await requireSession();
  await requireHousemate(roomId, user.id);

  await withRLS(user.id, async (tx) => {
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
