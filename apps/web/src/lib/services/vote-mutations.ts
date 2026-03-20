import { createDrizzleSupabaseClient } from "@openhospi/database";
import { votes } from "@openhospi/database/schema";
import { and, eq } from "drizzle-orm";

import { requireHousemate } from "@/lib/auth/server";

export async function submitVotesForUser(
  userId: string,
  roomId: string,
  rankings: { applicantId: string; rank: number }[],
  round: number = 1,
) {
  await requireHousemate(roomId, userId);

  await createDrizzleSupabaseClient(userId).rls(async (tx) => {
    await tx
      .delete(votes)
      .where(and(eq(votes.roomId, roomId), eq(votes.voterId, userId), eq(votes.round, round)));

    if (rankings.length > 0) {
      await tx.insert(votes).values(
        rankings.map((r) => ({
          roomId,
          voterId: userId,
          applicantId: r.applicantId,
          rank: r.rank,
          round,
        })),
      );
    }
  });

  return { success: true };
}
