import { withRLS } from "@openhospi/database";
import { privateKeyBackups, profilePhotos, profiles } from "@openhospi/database/schema";
import type { Profile, ProfilePhoto } from "@openhospi/database/types";
import { eq } from "drizzle-orm";

export type { Profile, ProfilePhoto };

export type ProfileWithPhotos = Profile & { photos: ProfilePhoto[] };

export function isProfileComplete(profile: ProfileWithPhotos): boolean {
  return (
    !!profile.firstName &&
    !!profile.gender &&
    !!profile.birthDate &&
    !!profile.studyProgram &&
    !!profile.preferredCity &&
    (profile.lifestyleTags?.length ?? 0) >= 2 &&
    profile.photos.length > 0
  );
}

export async function getProfile(userId: string): Promise<ProfileWithPhotos | null> {
  return withRLS(userId, async (tx) => {
    const [profile] = await tx.select().from(profiles).where(eq(profiles.id, userId));

    if (!profile) return null;

    const photos = await tx
      .select()
      .from(profilePhotos)
      .where(eq(profilePhotos.userId, userId))
      .orderBy(profilePhotos.slot);

    return { ...profile, photos };
  });
}

export async function hasEncryptionKeyBackup(userId: string): Promise<boolean> {
  const result = await withRLS(userId, (tx) =>
    tx
      .select({ userId: privateKeyBackups.userId })
      .from(privateKeyBackups)
      .where(eq(privateKeyBackups.userId, userId))
      .limit(1),
  );
  return result.length > 0;
}

export async function getProfilePhotos(userId: string): Promise<ProfilePhoto[]> {
  return withRLS(userId, (tx) =>
    tx
      .select()
      .from(profilePhotos)
      .where(eq(profilePhotos.userId, userId))
      .orderBy(profilePhotos.slot),
  );
}
