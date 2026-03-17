import { defineRelations } from "drizzle-orm";

import { applications, applicationStatusHistory, reviews } from "./applications";
import { account, session, user, verification } from "./auth-schema";
import { hospiEvents, hospiInvitations, votes } from "./events";
import { houseMembers, houses } from "./houses";
import { notifications, pushSubscriptions, pushTokens } from "./notifications";
import { activeConsents, consentRecords, dataRequests, processingRestrictions } from "./privacy";
import { profilePhotos, profiles } from "./profiles";
import { roomPhotos, rooms } from "./rooms";
import { blocks, reports } from "./security";

export const relations = defineRelations(
  {
    // Auth
    user,
    session,
    account,
    verification,
    // Profiles
    profiles,
    profilePhotos,
    // Houses
    houses,
    houseMembers,
    // Rooms
    rooms,
    roomPhotos,
    // Applications
    applications,
    applicationStatusHistory,
    reviews,
    // Events
    hospiEvents,
    hospiInvitations,
    votes,
    // Security
    reports,
    blocks,
    // Notifications
    pushTokens,
    pushSubscriptions,
    notifications,
    // Privacy / GDPR
    consentRecords,
    activeConsents,
    dataRequests,
    processingRestrictions,
  },
  (r) => ({
    // ── Auth relations (required for Better Auth experimental joins) ──
    user: {
      sessions: r.many.session(),
      accounts: r.many.account(),
    },
    session: {
      user: r.one.user({
        from: r.session.userId,
        to: r.user.id,
      }),
    },
    account: {
      user: r.one.user({
        from: r.account.userId,
        to: r.user.id,
      }),
    },

    // ── Profile relations ──
    profiles: {
      user: r.one.user({
        from: r.profiles.id,
        to: r.user.id,
      }),
      photos: r.many.profilePhotos(),
      rooms: r.many.rooms(),
      houseMembers: r.many.houseMembers(),
      applications: r.many.applications(),
    },
    profilePhotos: {
      profile: r.one.profiles({
        from: r.profilePhotos.userId,
        to: r.profiles.id,
      }),
    },

    // ── House relations ──
    houses: {
      creator: r.one.profiles({
        from: r.houses.createdBy,
        to: r.profiles.id,
      }),
      members: r.many.houseMembers(),
      rooms: r.many.rooms(),
    },
    houseMembers: {
      house: r.one.houses({
        from: r.houseMembers.houseId,
        to: r.houses.id,
      }),
      user: r.one.profiles({
        from: r.houseMembers.userId,
        to: r.profiles.id,
      }),
    },

    // ── Room relations ──
    rooms: {
      owner: r.one.profiles({
        from: r.rooms.ownerId,
        to: r.profiles.id,
      }),
      house: r.one.houses({
        from: r.rooms.houseId,
        to: r.houses.id,
      }),
      photos: r.many.roomPhotos(),
      applications: r.many.applications(),
      reviews: r.many.reviews(),
      events: r.many.hospiEvents(),
    },
    roomPhotos: {
      room: r.one.rooms({
        from: r.roomPhotos.roomId,
        to: r.rooms.id,
      }),
    },

    // ── Application relations ──
    applications: {
      room: r.one.rooms({
        from: r.applications.roomId,
        to: r.rooms.id,
      }),
      user: r.one.profiles({
        from: r.applications.userId,
        to: r.profiles.id,
      }),
      statusHistory: r.many.applicationStatusHistory(),
    },
    applicationStatusHistory: {
      application: r.one.applications({
        from: r.applicationStatusHistory.applicationId,
        to: r.applications.id,
      }),
    },
    reviews: {
      room: r.one.rooms({
        from: r.reviews.roomId,
        to: r.rooms.id,
      }),
      reviewer: r.one.profiles({
        from: r.reviews.reviewerId,
        to: r.profiles.id,
        alias: "reviewer",
      }),
      applicant: r.one.profiles({
        from: r.reviews.applicantId,
        to: r.profiles.id,
        alias: "applicant",
      }),
    },

    // ── Event relations ──
    hospiEvents: {
      room: r.one.rooms({
        from: r.hospiEvents.roomId,
        to: r.rooms.id,
      }),
      creator: r.one.profiles({
        from: r.hospiEvents.createdBy,
        to: r.profiles.id,
      }),
      invitations: r.many.hospiInvitations(),
    },
    hospiInvitations: {
      event: r.one.hospiEvents({
        from: r.hospiInvitations.eventId,
        to: r.hospiEvents.id,
      }),
      user: r.one.profiles({
        from: r.hospiInvitations.userId,
        to: r.profiles.id,
      }),
      application: r.one.applications({
        from: r.hospiInvitations.applicationId,
        to: r.applications.id,
      }),
    },
    votes: {
      room: r.one.rooms({
        from: r.votes.roomId,
        to: r.rooms.id,
      }),
      voter: r.one.profiles({
        from: r.votes.voterId,
        to: r.profiles.id,
        alias: "voter",
      }),
      applicant: r.one.profiles({
        from: r.votes.applicantId,
        to: r.profiles.id,
        alias: "voteApplicant",
      }),
    },

    // ── Security relations ──
    reports: {
      reporter: r.one.profiles({
        from: r.reports.reporterId,
        to: r.profiles.id,
        alias: "reporter",
      }),
      reportedUser: r.one.profiles({
        from: r.reports.reportedUserId,
        to: r.profiles.id,
        alias: "reportedUser",
      }),
      reportedRoom: r.one.rooms({
        from: r.reports.reportedRoomId,
        to: r.rooms.id,
      }),
    },
    blocks: {
      blocker: r.one.profiles({
        from: r.blocks.blockerId,
        to: r.profiles.id,
        alias: "blocker",
      }),
      blocked: r.one.profiles({
        from: r.blocks.blockedId,
        to: r.profiles.id,
        alias: "blocked",
      }),
    },

    // ── Notification relations ──
    pushTokens: {
      user: r.one.profiles({
        from: r.pushTokens.userId,
        to: r.profiles.id,
      }),
    },
    pushSubscriptions: {
      user: r.one.profiles({
        from: r.pushSubscriptions.userId,
        to: r.profiles.id,
      }),
    },
    notifications: {
      user: r.one.profiles({
        from: r.notifications.userId,
        to: r.profiles.id,
      }),
    },

    // ── Privacy / GDPR relations ──
    consentRecords: {
      user: r.one.profiles({
        from: r.consentRecords.userId,
        to: r.profiles.id,
      }),
    },
    activeConsents: {
      user: r.one.profiles({
        from: r.activeConsents.userId,
        to: r.profiles.id,
      }),
    },
    dataRequests: {
      user: r.one.profiles({
        from: r.dataRequests.userId,
        to: r.profiles.id,
      }),
    },
    processingRestrictions: {
      user: r.one.profiles({
        from: r.processingRestrictions.userId,
        to: r.profiles.id,
      }),
    },
  }),
);
