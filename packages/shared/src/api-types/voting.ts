import type { StudyLevel } from "../enums";

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

export type CloseRoomApplicant = {
  applicationId: string;
  userId: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  totalRank: number | null;
};
