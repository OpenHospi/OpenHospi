"use server";

import { db, withRLS } from "@openhospi/database";
import {
  activeConsents,
  applications,
  blocks,
  consentRecords,
  conversationMembers,
  dataRequests,
  hospiEvents,
  hospiInvitations,
  houseMembers,
  notifications,
  processingRestrictions,
  profilePhotos,
  profiles,
  publicKeys,
  pushSubscriptions,
  reports,
  reviews,
  roomPhotos,
  rooms,
  user,
  votes,
} from "@openhospi/database/schema";
import {
  PRIVACY_POLICY_VERSION,
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from "@openhospi/shared/constants";
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
    const userConversations = await tx
      .select()
      .from(conversationMembers)
      .where(eq(conversationMembers.userId, userId));
    const userBlocks = await tx.select().from(blocks).where(eq(blocks.blockerId, userId));
    const userVotes = await tx.select().from(votes).where(eq(votes.voterId, userId));
    const userNotifications = await tx
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId));
    const userPushSubscriptions = await tx
      .select({
        id: pushSubscriptions.id,
        endpoint: pushSubscriptions.endpoint,
        createdAt: pushSubscriptions.createdAt,
      })
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId));
    const [userPublicKey] = await tx.select().from(publicKeys).where(eq(publicKeys.userId, userId));
    const userConsents = await tx
      .select()
      .from(activeConsents)
      .where(eq(activeConsents.userId, userId));
    const userConsentHistory = await tx
      .select()
      .from(consentRecords)
      .where(eq(consentRecords.userId, userId));
    const userDataRequests = await tx
      .select({
        id: dataRequests.id,
        type: dataRequests.type,
        status: dataRequests.status,
        description: dataRequests.description,
        createdAt: dataRequests.createdAt,
        completedAt: dataRequests.completedAt,
      })
      .from(dataRequests)
      .where(eq(dataRequests.userId, userId));
    const userRestrictions = await tx
      .select()
      .from(processingRestrictions)
      .where(eq(processingRestrictions.userId, userId));
    const userReports = await tx
      .select({
        id: reports.id,
        reportType: reports.reportType,
        reason: reports.reason,
        status: reports.status,
        createdAt: reports.createdAt,
      })
      .from(reports)
      .where(eq(reports.reporterId, userId));
    const userEvents = await tx.select().from(hospiEvents).where(eq(hospiEvents.createdBy, userId));
    const userInvitations = await tx
      .select()
      .from(hospiInvitations)
      .where(eq(hospiInvitations.userId, userId));

    return {
      _metadata: {
        exportedAt: new Date().toISOString(),
        privacyPolicyVersion: PRIVACY_POLICY_VERSION,
        format: "GDPR Art. 20 data portability export",
      },
      profile,
      profilePhotos: photos,
      rooms: userRooms,
      roomPhotos: userRoomPhotos,
      applications: userApplications,
      reviews: userReviews,
      houseMembers: userHouseMembers,
      conversations: userConversations,
      blocks: userBlocks,
      votes: userVotes,
      notifications: userNotifications,
      pushSubscriptions: userPushSubscriptions,
      publicKey: userPublicKey ?? null,
      consents: userConsents,
      consentHistory: userConsentHistory,
      dataRequests: userDataRequests,
      processingRestrictions: userRestrictions,
      reports: userReports,
      events: userEvents,
      invitations: userInvitations,
    };
  });

  return { data };
}

function toCsvRow(values: unknown[]): string {
  return values
    .map((v) => {
      const str = v == null ? "" : String(v);
      return str.includes(",") || str.includes('"') || str.includes("\n")
        ? `"${str.replaceAll('"', '""')}"`
        : str;
    })
    .join(",");
}

function tableToCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [toCsvRow(headers)];
  for (const row of rows) {
    lines.push(toCsvRow(headers.map((h) => row[h])));
  }
  return lines.join("\n");
}

export async function exportDataCSV() {
  const result = await exportData();
  if ("error" in result) return result;

  const { data } = result;
  if (!data) return { error: "NO_DATA" };

  const categories: [string, Record<string, unknown>[]][] = [
    ["profile.csv", data.profile ? [data.profile] : []],
    ["profile-photos.csv", data.profilePhotos],
    ["rooms.csv", data.rooms],
    ["room-photos.csv", data.roomPhotos],
    ["applications.csv", data.applications],
    ["reviews.csv", data.reviews],
    ["house-members.csv", data.houseMembers],
    ["conversations.csv", data.conversations],
    ["blocks.csv", data.blocks],
    ["votes.csv", data.votes],
    ["notifications.csv", data.notifications],
    ["push-subscriptions.csv", data.pushSubscriptions],
    ["public-key.csv", data.publicKey ? [data.publicKey] : []],
    ["consents.csv", data.consents],
    ["consent-history.csv", data.consentHistory],
    ["data-requests.csv", data.dataRequests],
    ["processing-restrictions.csv", data.processingRestrictions],
    ["reports.csv", data.reports],
    ["events.csv", data.events],
    ["invitations.csv", data.invitations],
  ];

  const csvFiles: Record<string, string> = {};
  for (const [filename, rows] of categories) {
    if (rows.length > 0) csvFiles[filename] = tableToCsv(rows);
  }

  return { csvFiles };
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
