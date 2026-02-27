import { withRLS } from "@openhospi/database";
import { applications, profiles, votes } from "@openhospi/database/schema";
import { ApplicationStatus } from "@openhospi/shared/enums";
import { and, asc, eq, inArray } from "drizzle-orm";

const VOTABLE_STATUSES = [
  ApplicationStatus.invited,
  ApplicationStatus.attending,
] as const;

export type VotableApplicant = {
  applicationId: string;
  userId: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  status: string;
};

export type VoteBallot = {
  voterId: string;
  voterName: string;
  rankings: { applicantId: string; rank: number }[];
};

export type VoteBoard = {
  applicants: VotableApplicant[];
  ballots: VoteBallot[];
  aggregated: { applicantId: string; totalRank: number; voteCount: number }[];
};

export async function getVotableApplicants(
  roomId: string,
  userId: string,
): Promise<VotableApplicant[]> {
  return withRLS(userId, async (tx) => {
    return tx
      .select({
        applicationId: applications.id,
        userId: applications.userId,
        firstName: profiles.firstName,
        lastName: profiles.lastName,
        avatarUrl: profiles.avatarUrl,
        status: applications.status,
      })
      .from(applications)
      .innerJoin(profiles, eq(profiles.id, applications.userId))
      .where(
        and(
          eq(applications.roomId, roomId),
          inArray(applications.status, [...VOTABLE_STATUSES]),
        ),
      )
      .orderBy(asc(profiles.firstName));
  });
}

export async function getRoomVotes(
  roomId: string,
  userId: string,
  round: number = 1,
): Promise<VoteBoard> {
  return withRLS(userId, async (tx) => {
    const applicants = await getVotableApplicantsInTx(tx, roomId);

    const allVotes = await tx
      .select({
        voterId: votes.voterId,
        voterName: profiles.firstName,
        applicantId: votes.applicantId,
        rank: votes.rank,
      })
      .from(votes)
      .innerJoin(profiles, eq(profiles.id, votes.voterId))
      .where(and(eq(votes.roomId, roomId), eq(votes.round, round)))
      .orderBy(asc(votes.rank));

    // Group by voter
    const voterMap = new Map<string, VoteBallot>();
    for (const v of allVotes) {
      const existing = voterMap.get(v.voterId);
      if (existing) {
        existing.rankings.push({ applicantId: v.applicantId, rank: v.rank });
      } else {
        voterMap.set(v.voterId, {
          voterId: v.voterId,
          voterName: v.voterName,
          rankings: [{ applicantId: v.applicantId, rank: v.rank }],
        });
      }
    }

    // Aggregate rankings
    const rankSums = new Map<string, { total: number; count: number }>();
    for (const v of allVotes) {
      const existing = rankSums.get(v.applicantId) ?? { total: 0, count: 0 };
      existing.total += v.rank;
      existing.count += 1;
      rankSums.set(v.applicantId, existing);
    }

    const aggregated = Array.from(rankSums.entries())
      .map(([applicantId, { total, count }]) => ({
        applicantId,
        totalRank: total,
        voteCount: count,
      }))
      .sort((a, b) => a.totalRank - b.totalRank);

    return {
      applicants,
      ballots: Array.from(voterMap.values()),
      aggregated,
    };
  });
}

async function getVotableApplicantsInTx(
  tx: Parameters<Parameters<typeof withRLS>[1]>[0],
  roomId: string,
): Promise<VotableApplicant[]> {
  return tx
    .select({
      applicationId: applications.id,
      userId: applications.userId,
      firstName: profiles.firstName,
      lastName: profiles.lastName,
      avatarUrl: profiles.avatarUrl,
      status: applications.status,
    })
    .from(applications)
    .innerJoin(profiles, eq(profiles.id, applications.userId))
    .where(
      and(
        eq(applications.roomId, roomId),
        inArray(applications.status, [...VOTABLE_STATUSES]),
      ),
    )
    .orderBy(asc(profiles.firstName));
}
