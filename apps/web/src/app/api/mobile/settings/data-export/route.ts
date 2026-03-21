import { createDrizzleSupabaseClient } from "@openhospi/database";
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
  devices,
  pushSubscriptions,
  reviews,
  roomPhotos,
  rooms,
  votes,
} from "@openhospi/database/schema";
import { PRIVACY_POLICY_VERSION } from "@openhospi/shared/constants";
import { CommonError } from "@openhospi/shared/error-codes";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { apiError, requireApiSession } from "@/app/api/mobile/_lib/auth";
import { checkRateLimit, rateLimiters } from "@/lib/services/rate-limit";

export async function POST(request: Request) {
  try {
    const session = await requireApiSession(request);
    const userId = session.user.id;

    if (!(await checkRateLimit(rateLimiters.exportData, userId))) {
      return apiError("Rate limited", 429, CommonError.rate_limited);
    }

    const data = await createDrizzleSupabaseClient(userId).rls(async (tx) => {
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
      const userDevices = await tx.select().from(devices).where(eq(devices.userId, userId));
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
      const userEvents = await tx
        .select()
        .from(hospiEvents)
        .where(eq(hospiEvents.createdBy, userId));
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
        devices: userDevices,
        consents: userConsents,
        consentHistory: userConsentHistory,
        dataRequests: userDataRequests,
        processingRestrictions: userRestrictions,
        events: userEvents,
        invitations: userInvitations,
      };
    });

    return NextResponse.json({ data });
  } catch (e) {
    if (e instanceof NextResponse) return e;
    throw e;
  }
}
