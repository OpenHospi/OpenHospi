import type { ApplicationStatus, ReviewDecision, StudyLevel } from "../enums";

export type ApplicantReview = {
  reviewerId: string;
  reviewerName: string;
  decision: ReviewDecision;
  notes: string | null;
};

export type RoomApplicant = {
  applicationId: string;
  userId: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  gender: string | null;
  birthDate: string | null;
  studyProgram: string | null;
  studyLevel: StudyLevel | null;
  bio: string | null;
  lifestyleTags: string[];
  vereniging: string | null;
  institutionDomain: string;
  personalMessage: string | null;
  status: ApplicationStatus;
  appliedAt: string;
  photos: { id: string; slot: number; url: string; caption: string | null }[];
  reviews: ApplicantReview[];
};
