"use server";

import { db, withRLS } from "@openhospi/database";
import {
  applications,
  houseMembers,
  profilePhotos,
  profiles,
  reviews,
  roomPhotos,
  rooms,
  user,
} from "@openhospi/database/schema";
import { SUPPORTED_LOCALES, type SupportedLocale } from "@openhospi/shared/constants";
import { eq } from "drizzle-orm";

import { requireSession } from "@/lib/auth-server";
import { deletePhotoFromStorage } from "@/lib/photos";
import { checkRateLimit, rateLimiters } from "@/lib/rate-limit";

export async function exportData() {
  const session = await requireSession();
  const userId = session.user.id;

  if (!(await checkRateLimit(rateLimiters.exportData, userId))) {
    return { error: "RATE_LIMITED" };
  }

  const data = await withRLS(userId, async (tx) => {
    const [profile] = await tx.select().from(profiles).where(eq(profiles.id, userId));
    const photos = await tx.select().from(profilePhotos).where(eq(profilePhotos.userId, userId));
    const userRooms = await tx.select().from(rooms).where(eq(rooms.ownerId, userId));
    const userRoomPhotos = [];
    for (const room of userRooms) {
      const rPhotos = await tx.select().from(roomPhotos).where(eq(roomPhotos.roomId, room.id));
      userRoomPhotos.push(...rPhotos);
    }
    const userApplications = await tx
      .select()
      .from(applications)
      .where(eq(applications.userId, userId));
    const userReviews = await tx.select().from(reviews).where(eq(reviews.reviewerId, userId));
    const userHouseMembers = await tx
      .select()
      .from(houseMembers)
      .where(eq(houseMembers.userId, userId));

    return {
      profile,
      profilePhotos: photos,
      rooms: userRooms,
      roomPhotos: userRoomPhotos,
      applications: userApplications,
      reviews: userReviews,
      houseMembers: userHouseMembers,
      exportedAt: new Date().toISOString(),
    };
  });

  return { data };
}

export async function updatePreferredLocale(locale: SupportedLocale) {
  if (!SUPPORTED_LOCALES.includes(locale)) {
    return { error: "INVALID_LOCALE" };
  }
  const session = await requireSession();
  await withRLS(session.user.id, async (tx) => {
    await tx
      .update(profiles)
      .set({ preferredLocale: locale })
      .where(eq(profiles.id, session.user.id));
  });
  return { success: true };
}

export async function deleteAccount() {
  const session = await requireSession();
  const userId = session.user.id;

  // Collect all photo URLs to delete from storage
  const photoUrls = await withRLS(userId, async (tx) => {
    const pPhotos = await tx
      .select({ url: profilePhotos.url })
      .from(profilePhotos)
      .where(eq(profilePhotos.userId, userId));

    const userRooms = await tx
      .select({ id: rooms.id })
      .from(rooms)
      .where(eq(rooms.ownerId, userId));

    const rPhotoUrls: string[] = [];
    for (const room of userRooms) {
      const rPhotos = await tx
        .select({ url: roomPhotos.url })
        .from(roomPhotos)
        .where(eq(roomPhotos.roomId, room.id));
      rPhotoUrls.push(...rPhotos.map((p) => p.url));
    }

    return [...pPhotos.map((p) => p.url), ...rPhotoUrls];
  });

  // Delete photos from storage
  for (const url of photoUrls) {
    try {
      await deletePhotoFromStorage(url);
    } catch {
      // Continue even if blob deletion fails
    }
  }

  // Delete profile first (FK cascades handle rooms, applications, etc.)
  // Then delete the auth user (cascades to sessions, accounts)
  // Uses db directly (owner role) since user is deleting themselves
  await db.delete(profiles).where(eq(profiles.id, userId));
  await db.delete(user).where(eq(user.id, userId));

  return { success: true };
}
