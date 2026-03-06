import { withRLS } from "@openhospi/database";
import {
  houseMembers,
  houses,
  privateKeyBackups,
  processingRestrictions,
  profilePhotos,
  profiles,
  rooms,
} from "@openhospi/database/schema";
import type { Locale } from "@openhospi/i18n";
import type { HouseMemberRole } from "@openhospi/shared/enums";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { headers } from "next/headers";
import { getLocale } from "next-intl/server";

import { redirect } from "@/i18n/navigation-app";
import type { HousePermission } from "@/lib/permissions";
import { hasPermission } from "@/lib/permissions";

import { auth } from "./auth";

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function requireSession() {
  const session = await getSession();
  if (!session) {
    const locale = (await getLocale()) as Locale;
    return redirect({ href: "/login", locale });
  }
  return session;
}

export async function requireVerifiedEmail() {
  const session = await requireSession();
  if (!session.user.emailVerified) {
    const locale = (await getLocale()) as Locale;
    redirect({ href: "/onboarding", locale });
  }
  return session;
}

export async function requireAdmin() {
  const session = await requireSession();
  const userWithRole = session.user as typeof session.user & { role?: string };
  if (userWithRole.role !== "admin") {
    const locale = (await getLocale()) as Locale;
    redirect({ href: "/login", locale });
  }
  return session;
}

export async function requireRoomOwnership(roomId: string, userId: string) {
  const room = await withRLS(userId, async (tx) => {
    const [r] = await tx
      .select({ id: rooms.id })
      .from(rooms)
      .where(and(eq(rooms.id, roomId), eq(rooms.ownerId, userId)));
    return r;
  });
  if (!room) throw new Error("Room not found");
}

export async function requireHousemate(
  roomId: string,
  userId: string,
  roles?: string[],
): Promise<string> {
  const row = await withRLS(userId, async (tx) => {
    const conditions = [eq(rooms.id, roomId), eq(houseMembers.userId, userId)];
    if (roles) {
      conditions.push(inArray(houseMembers.role, roles as HouseMemberRole[]));
    }

    const [r] = await tx
      .select({ role: houseMembers.role })
      .from(houseMembers)
      .innerJoin(houses, eq(houseMembers.houseId, houses.id))
      .innerJoin(rooms, eq(rooms.houseId, houses.id))
      .where(and(...conditions));
    return r;
  });
  if (!row) throw new Error("Not a housemate");
  return row.role!;
}

export async function requireHousePermission(
  roomId: string,
  userId: string,
  permission: HousePermission,
): Promise<void> {
  const role = await requireHousemate(roomId, userId);
  if (!hasPermission(role as HouseMemberRole, permission)) {
    throw new Error("Forbidden");
  }
}

export async function requireCompleteProfile(userId: string) {
  const result = await withRLS(userId, async (tx) => {
    const [profile] = await tx
      .select({
        firstName: profiles.firstName,
        gender: profiles.gender,
        birthDate: profiles.birthDate,
        studyProgram: profiles.studyProgram,
        preferredCity: profiles.preferredCity,
        lifestyleTags: profiles.lifestyleTags,
      })
      .from(profiles)
      .where(eq(profiles.id, userId));

    if (!profile) return { needsRedirect: true };

    const hasPhoto = await tx
      .select({ id: profilePhotos.id })
      .from(profilePhotos)
      .where(eq(profilePhotos.userId, userId))
      .limit(1);

    const hasBackup = await tx
      .select({ userId: privateKeyBackups.userId })
      .from(privateKeyBackups)
      .where(eq(privateKeyBackups.userId, userId))
      .limit(1);

    const complete =
      !!profile.firstName &&
      profile.gender !== null &&
      profile.birthDate !== null &&
      profile.studyProgram !== null &&
      profile.preferredCity !== null &&
      (profile.lifestyleTags?.length ?? 0) >= 2 &&
      hasPhoto.length > 0 &&
      hasBackup.length > 0;

    return { needsRedirect: !complete };
  });

  if (result.needsRedirect) {
    const locale = (await getLocale()) as Locale;
    redirect({ href: "/onboarding", locale });
  }
}

export async function requireNotRestricted(userId: string) {
  if (await isRestricted(userId)) {
    return { error: "PROCESSING_RESTRICTED" as const };
  }
  return null;
}

export async function isRestricted(userId: string): Promise<boolean> {
  const [restriction] = await withRLS(userId, (tx) =>
    tx
      .select({ id: processingRestrictions.id })
      .from(processingRestrictions)
      .where(
        and(eq(processingRestrictions.userId, userId), isNull(processingRestrictions.liftedAt)),
      )
      .limit(1),
  );
  return !!restriction;
}
