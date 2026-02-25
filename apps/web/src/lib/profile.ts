import { db } from "@openhospi/database";
import { profilePhotos, profiles } from "@openhospi/database/schema";
import type { Profile, ProfilePhoto } from "@openhospi/database/types";
import { eq } from "drizzle-orm";

export type { Profile, ProfilePhoto };

export type ProfileWithPhotos = Profile & { photos: ProfilePhoto[] };

export function isProfileComplete(profile: ProfileWithPhotos): boolean {
  return (
    !!profile.gender &&
    !!profile.birthDate &&
    !!profile.studyProgram &&
    !!profile.preferredCity &&
    !!profile.availableFrom &&
    (profile.lifestyleTags?.length ?? 0) >= 2 &&
    profile.photos.length > 0
  );
}

export async function getProfile(userId: string): Promise<ProfileWithPhotos | null> {
  const [profile] = await db.select().from(profiles).where(eq(profiles.id, userId));

  if (!profile) return null;

  const photos = await getProfilePhotos(userId);

  return { ...profile, photos };
}

export async function getProfilePhotos(userId: string): Promise<ProfilePhoto[]> {
  return db
    .select()
    .from(profilePhotos)
    .where(eq(profilePhotos.userId, userId))
    .orderBy(profilePhotos.slot);
}
