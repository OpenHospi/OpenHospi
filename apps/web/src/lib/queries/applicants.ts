import { createDrizzleSupabaseClient } from "@openhospi/database";
import { applications, profilePhotos, profiles, reviews } from "@openhospi/database/schema";
import { MAX_APPLICANTS_PER_PAGE } from "@openhospi/shared/constants";
import type { Gender, LifestyleTag, StudyLevel, Vereniging } from "@openhospi/shared/enums";
import { ApplicationStatus, ReviewDecision } from "@openhospi/shared/enums";
import { and, asc, eq, inArray, ne } from "drizzle-orm";

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
    const rows = await tx
      .select({
        applicationId: applications.id,
        userId: applications.userId,
        personalMessage: applications.personalMessage,
        status: applications.status,
        appliedAt: applications.appliedAt,
        firstName: profiles.firstName,
        lastName: profiles.lastName,
        avatarUrl: profiles.avatarUrl,
        gender: profiles.gender,
        birthDate: profiles.birthDate,
        studyProgram: profiles.studyProgram,
        studyLevel: profiles.studyLevel,
        bio: profiles.bio,
        lifestyleTags: profiles.lifestyleTags,
        vereniging: profiles.vereniging,
        institutionDomain: profiles.institutionDomain,
      })
      .from(applications)
      .innerJoin(profiles, eq(profiles.id, applications.userId))
      .where(
        and(eq(applications.roomId, roomId), ne(applications.status, ApplicationStatus.withdrawn)),
      )
      .orderBy(asc(applications.appliedAt))
      .limit(MAX_APPLICANTS_PER_PAGE);

    if (rows.length === 0) return [];

    const userIds = rows.map((r) => r.userId);

    // Batch fetch photos for all applicants
    const allPhotos = await tx
      .select({
        userId: profilePhotos.userId,
        id: profilePhotos.id,
        slot: profilePhotos.slot,
        url: profilePhotos.url,
        caption: profilePhotos.caption,
      })
      .from(profilePhotos)
      .where(inArray(profilePhotos.userId, userIds))
      .orderBy(profilePhotos.slot);

    // Batch fetch reviews for all applicants
    const allReviews = await tx
      .select({
        applicantId: reviews.applicantId,
        reviewerId: reviews.reviewerId,
        decision: reviews.decision,
        notes: reviews.notes,
        reviewerName: profiles.firstName,
      })
      .from(reviews)
      .innerJoin(profiles, eq(profiles.id, reviews.reviewerId))
      .where(and(eq(reviews.roomId, roomId), inArray(reviews.applicantId, userIds)));

    // Group photos by userId
    const photosByUser = new Map<
      string,
      { id: string; slot: number; url: string; caption: string | null }[]
    >();
    for (const photo of allPhotos) {
      const list = photosByUser.get(photo.userId) ?? [];
      list.push({ id: photo.id, slot: photo.slot, url: photo.url, caption: photo.caption });
      photosByUser.set(photo.userId, list);
    }

    // Group reviews by applicantId
    const reviewsByUser = new Map<string, ApplicantReview[]>();
    for (const rv of allReviews) {
      const list = reviewsByUser.get(rv.applicantId) ?? [];
      list.push({
        reviewerId: rv.reviewerId,
        reviewerName: rv.reviewerName,
        decision: rv.decision,
        notes: rv.notes,
      });
      reviewsByUser.set(rv.applicantId, list);
    }

    return rows.map((r) => ({
      ...r,
      lifestyleTags: r.lifestyleTags ?? [],
      photos: photosByUser.get(r.userId) ?? [],
      reviews: reviewsByUser.get(r.userId) ?? [],
    }));
  });
}
