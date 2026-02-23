import { pool } from "./db";

export type ProfilePhoto = {
  id: string;
  slot: number;
  url: string;
  caption: string | null;
};

export type Profile = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  institution_domain: string;
  affiliation: string;
  gender: string | null;
  birth_date: string | null;
  study_program: string | null;
  study_level: string | null;
  bio: string | null;
  lifestyle_tags: string[] | null;
  preferred_city: string | null;
  max_rent: number | null;
  available_from: string | null;
  vereniging: string | null;
  instagram_handle: string | null;
  show_instagram: boolean;
  photos: ProfilePhoto[];
};

export function isProfileComplete(profile: Profile): boolean {
  return (
    !!profile.gender &&
    !!profile.birth_date &&
    !!profile.study_program &&
    !!profile.preferred_city &&
    !!profile.available_from &&
    (profile.lifestyle_tags?.length ?? 0) >= 2 &&
    profile.photos.length > 0
  );
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { rows } = await pool.query(
    `SELECT id, first_name, last_name, email, institution_domain, affiliation,
            gender, birth_date, study_program, study_level, bio, lifestyle_tags,
            preferred_city, max_rent, available_from, vereniging,
            instagram_handle, show_instagram
     FROM profiles WHERE id = $1`,
    [userId],
  );

  if (rows.length === 0) return null;

  const profile = rows[0];
  const photos = await getProfilePhotos(userId);

  return {
    ...profile,
    birth_date: profile.birth_date ? profile.birth_date.toISOString().split("T")[0] : null,
    available_from: profile.available_from
      ? profile.available_from.toISOString().split("T")[0]
      : null,
    show_instagram: profile.show_instagram ?? false,
    photos,
  };
}

export async function getProfilePhotos(userId: string): Promise<ProfilePhoto[]> {
  const { rows } = await pool.query(
    `SELECT id, slot, url, caption FROM profile_photos
     WHERE user_id = $1 ORDER BY slot`,
    [userId],
  );
  return rows;
}
