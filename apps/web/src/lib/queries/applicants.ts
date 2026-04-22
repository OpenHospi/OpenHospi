import { createDrizzleSupabaseClient } from "@openhospi/database";
import { MAX_APPLICANTS_PER_PAGE } from "@openhospi/shared/constants";
import type { Gender, LifestyleTag, StudyLevel, Vereniging } from "@openhospi/shared/enums";
import { ApplicationStatus, ReviewDecision } from "@openhospi/shared/enums";

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
  gender: Gender | null;
  birthDate: string | null;
  studyProgram: string | null;
  studyLevel: StudyLevel | null;
  bio: string | null;
  lifestyleTags: LifestyleTag[];
  vereniging: Vereniging | null;
  institutionDomain: string;
  personalMessage: string | null;
  status: ApplicationStatus;
  appliedAt: Date;
  photos: { id: string; slot: number; url: string; caption: string | null }[];
  reviews: ApplicantReview[];
};

export async function getRoomApplicants(roomId: string, userId: string): Promise<RoomApplicant[]> {
  return createDrizzleSupabaseClient(userId).rls(async (tx) => {
    const rows = await tx.query.applications.findMany({
      where: {
        roomId,
        NOT: { status: ApplicationStatus.withdrawn },
      },
      orderBy: { appliedAt: "asc" },
      limit: MAX_APPLICANTS_PER_PAGE,
      columns: {
        id: true,
        userId: true,
        personalMessage: true,
        status: true,
        appliedAt: true,
      },
      with: {
        user: {
          columns: {
            firstName: true,
            lastName: true,
            avatarUrl: true,
            gender: true,
            birthDate: true,
            studyProgram: true,
            studyLevel: true,
            bio: true,
            lifestyleTags: true,
            vereniging: true,
            institutionDomain: true,
          },
          with: {
            photos: {
              columns: { id: true, slot: true, url: true, caption: true },
              orderBy: { slot: "asc" },
            },
            reviewsReceived: {
              where: { roomId },
              columns: {
                reviewerId: true,
                decision: true,
                notes: true,
              },
              with: {
                reviewer: {
                  columns: { firstName: true },
                },
              },
            },
          },
        },
      },
    });

    return rows.map((r) => ({
      applicationId: r.id,
      userId: r.userId,
      personalMessage: r.personalMessage,
      status: r.status,
      appliedAt: r.appliedAt,
      firstName: r.user.firstName,
      lastName: r.user.lastName,
      avatarUrl: r.user.avatarUrl,
      gender: r.user.gender,
      birthDate: r.user.birthDate,
      studyProgram: r.user.studyProgram,
      studyLevel: r.user.studyLevel,
      bio: r.user.bio,
      lifestyleTags: r.user.lifestyleTags ?? [],
      vereniging: r.user.vereniging,
      institutionDomain: r.user.institutionDomain,
      photos: r.user.photos,
      reviews: r.user.reviewsReceived.map((rv) => ({
        reviewerId: rv.reviewerId,
        reviewerName: rv.reviewer.firstName,
        decision: rv.decision,
        notes: rv.notes,
      })),
    }));
  });
}
