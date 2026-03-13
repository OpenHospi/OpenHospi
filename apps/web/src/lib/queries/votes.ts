import { createDrizzleSupabaseClient } from "@/lib/db";
import { applications, profiles, votes } from "@/lib/db/schema";
import {
  ApplicationStatus,
  isTerminalApplicationStatus,
  type StudyLevel,
} from "@openhospi/shared/enums";
import { and, asc, eq, inArray, ne, sum } from "drizzle-orm";

export type VotableApplicant = {
  applicationId: string;
  userId: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  status: string;
  studyProgram: string | null;
  studyLevel: StudyLevel | null;
  birthDate: string | null;
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
  return createDrizzleSupabaseClient(userId).rls(async (tx) => {
    return tx
      .select({
        applicationId: applications.id,
        userId: applications.userId,
        firstName: profiles.firstName,
        lastName: profiles.lastName,
        avatarUrl: profiles.avatarUrl,
        status: applications.status,
        studyProgram: profiles.studyProgram,
        studyLevel: profiles.studyLevel,
        birthDate: profiles.birthDate,
      })
      .from(applications)
      .innerJoin(profiles, eq(profiles.id, applications.userId))
      .where(and(eq(applications.roomId, roomId), eq(applications.status, ApplicationStatus.hospi)))
      .orderBy(asc(profiles.firstName));
  });
}

export async function getRoomVotes(
  roomId: string,
  userId: string,
  round: number = 1,
): Promise<VoteBoard> {
  return createDrizzleSupabaseClient(userId).rls(async (tx) => {
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

export type CloseRoomApplicant = {
  applicationId: string;
  userId: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  totalRank: number | null;
};

export async function getCloseRoomApplicants(
  roomId: string,
  userId: string,
): Promise<CloseRoomApplicant[]> {
  return createDrizzleSupabaseClient(userId).rls(async (tx) => {
    // Get non-terminal applicants
    const rows = await tx
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
        and(eq(applications.roomId, roomId), ne(applications.status, ApplicationStatus.withdrawn)),
      )
      .orderBy(asc(profiles.firstName));

    const nonTerminal = rows.filter(
      (r) => !isTerminalApplicationStatus(r.status as ApplicationStatus),
    );
    if (nonTerminal.length === 0) return [];

    // Get vote rank sums for these applicants
    const userIds = nonTerminal.map((r) => r.userId);
    const voteRows = await tx
      .select({
        applicantId: votes.applicantId,
        totalRank: sum(votes.rank),
      })
      .from(votes)
      .where(and(eq(votes.roomId, roomId), inArray(votes.applicantId, userIds)))
      .groupBy(votes.applicantId);

    const rankMap = new Map(voteRows.map((v) => [v.applicantId, Number(v.totalRank)]));

    return nonTerminal
      .map((r) => ({
        applicationId: r.applicationId,
        userId: r.userId,
        firstName: r.firstName,
        lastName: r.lastName,
        avatarUrl: r.avatarUrl,
        totalRank: rankMap.get(r.userId) ?? null,
      }))
      .sort((a, b) => {
        // Sort by rank (lowest first), null ranks at the end
        if (a.totalRank == null && b.totalRank == null) return 0;
        if (a.totalRank == null) return 1;
        if (b.totalRank == null) return -1;
        return a.totalRank - b.totalRank;
      });
  });
}

async function getVotableApplicantsInTx(
  tx: Parameters<Parameters<ReturnType<typeof createDrizzleSupabaseClient>["rls"]>[0]>[0],
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
      studyProgram: profiles.studyProgram,
      studyLevel: profiles.studyLevel,
      birthDate: profiles.birthDate,
    })
    .from(applications)
    .innerJoin(profiles, eq(profiles.id, applications.userId))
    .where(and(eq(applications.roomId, roomId), eq(applications.status, ApplicationStatus.hospi)))
    .orderBy(asc(profiles.firstName));
}
