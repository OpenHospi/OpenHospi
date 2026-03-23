"use server";

import { requireNotRestricted, requireSession } from "@/lib/auth/server";
import { submitVotesForUser } from "@/lib/services/vote-mutations";

export async function submitVotes(
  roomId: string,
  rankings: { applicantId: string; rank: number }[],
  round: number = 1,
) {
  const { user } = await requireSession();
  const restricted = await requireNotRestricted(user.id);
  if (restricted) throw new Error(restricted.error);

  await submitVotesForUser(user.id, roomId, rankings, round);
}
