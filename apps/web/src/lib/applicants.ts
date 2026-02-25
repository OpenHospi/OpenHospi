import { MAX_APPLICANTS_PER_PAGE } from "@openhospi/shared/constants";
import type { ApplicationStatus, ReviewDecision } from "@openhospi/shared/enums";

import { pool } from "./db";

export type ApplicantReview = {
  reviewer_id: string;
  reviewer_name: string;
  decision: ReviewDecision;
  notes: string | null;
};

export type RoomApplicant = {
  application_id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  gender: string | null;
  birth_date: string | null;
  study_program: string | null;
  study_level: string | null;
  bio: string | null;
  lifestyle_tags: string[];
  vereniging: string | null;
  instagram_handle: string | null;
  show_instagram: boolean;
  personal_message: string | null;
  status: ApplicationStatus;
  applied_at: string;
  photos: { id: string; slot: number; url: string; caption: string | null }[];
  reviews: ApplicantReview[];
};

export async function getRoomApplicants(roomId: string): Promise<RoomApplicant[]> {
  const { rows } = await pool.query(
    `SELECT
       a.id AS application_id, a.user_id, a.personal_message, a.status, a.applied_at,
       p.first_name, p.last_name, p.avatar_url, p.gender, p.birth_date,
       p.study_program, p.study_level, p.bio, p.lifestyle_tags,
       p.vereniging, p.instagram_handle, p.show_instagram
     FROM applications a
     JOIN profiles p ON p.id = a.user_id
     WHERE a.room_id = $1 AND a.status != 'withdrawn'
     ORDER BY a.applied_at ASC
     LIMIT $2`,
    [roomId, MAX_APPLICANTS_PER_PAGE],
  );

  if (rows.length === 0) return [];

  // Batch fetch photos for all applicants
  const userIds = rows.map((r) => r.user_id);
  const { rows: allPhotos } = await pool.query(
    `SELECT user_id, id, slot, url, caption
     FROM profile_photos
     WHERE user_id = ANY($1)
     ORDER BY slot`,
    [userIds],
  );

  // Batch fetch reviews for all applicants (keyed by applicant_id = user_id)
  const { rows: allReviews } = await pool.query(
    `SELECT
       rv.applicant_id, rv.reviewer_id, rv.decision, rv.notes,
       p.first_name AS reviewer_name
     FROM reviews rv
     JOIN profiles p ON p.id = rv.reviewer_id
     WHERE rv.room_id = $1 AND rv.applicant_id = ANY($2)`,
    [roomId, userIds],
  );

  // Group photos by user_id
  const photosByUser = new Map<
    string,
    { id: string; slot: number; url: string; caption: string | null }[]
  >();
  for (const photo of allPhotos) {
    const list = photosByUser.get(photo.user_id) ?? [];
    list.push({
      id: photo.id,
      slot: photo.slot,
      url: photo.url,
      caption: photo.caption,
    });
    photosByUser.set(photo.user_id, list);
  }

  // Group reviews by applicant_id (= user_id)
  const reviewsByUser = new Map<string, ApplicantReview[]>();
  for (const rv of allReviews) {
    const list = reviewsByUser.get(rv.applicant_id) ?? [];
    list.push({
      reviewer_id: rv.reviewer_id,
      reviewer_name: rv.reviewer_name,
      decision: rv.decision,
      notes: rv.notes,
    });
    reviewsByUser.set(rv.applicant_id, list);
  }

  return rows.map((r) => ({
    ...r,
    applied_at: r.applied_at.toISOString(),
    birth_date: r.birth_date ? r.birth_date.toISOString().split("T")[0] : null,
    lifestyle_tags: r.lifestyle_tags ?? [],
    show_instagram: r.show_instagram ?? false,
    photos: photosByUser.get(r.user_id) ?? [],
    reviews: reviewsByUser.get(r.user_id) ?? [],
  }));
}
