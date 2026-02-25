import { db } from "@openhospi/database";
import { housemates, profilePhotos, profiles, rooms } from "@openhospi/database/schema";
import { and, eq, inArray } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "./auth";

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function requireSession(locale: string) {
  const session = await getSession();
  if (!session) redirect(`/${locale}/login`);
  return session;
}

export async function requireRoomOwnership(roomId: string, userId: string) {
  const [room] = await db
    .select({ id: rooms.id })
    .from(rooms)
    .where(and(eq(rooms.id, roomId), eq(rooms.ownerId, userId)));
  if (!room) throw new Error("Room not found");
}

export async function requireHousemate(
  roomId: string,
  userId: string,
  roles?: string[],
): Promise<string> {
  const conditions = [eq(housemates.roomId, roomId), eq(housemates.userId, userId)];
  if (roles) {
    conditions.push(inArray(housemates.role, roles as ("owner" | "admin" | "member")[]));
  }

  const [row] = await db
    .select({ role: housemates.role })
    .from(housemates)
    .where(and(...conditions));
  if (!row) throw new Error("Not a housemate");
  return row.role!;
}

export async function requireCompleteProfile(userId: string, locale: string) {
  const [profile] = await db
    .select({
      gender: profiles.gender,
      birthDate: profiles.birthDate,
      studyProgram: profiles.studyProgram,
      preferredCity: profiles.preferredCity,
      availableFrom: profiles.availableFrom,
      lifestyleTags: profiles.lifestyleTags,
    })
    .from(profiles)
    .where(eq(profiles.id, userId));

  if (!profile) {
    redirect(`/${locale}/onboarding`);
  }

  const hasPhoto = await db
    .select({ id: profilePhotos.id })
    .from(profilePhotos)
    .where(eq(profilePhotos.userId, userId))
    .limit(1);

  const complete =
    profile.gender !== null &&
    profile.birthDate !== null &&
    profile.studyProgram !== null &&
    profile.preferredCity !== null &&
    profile.availableFrom !== null &&
    (profile.lifestyleTags?.length ?? 0) >= 2 &&
    hasPhoto.length > 0;

  if (!complete) {
    redirect(`/${locale}/onboarding`);
  }
}
