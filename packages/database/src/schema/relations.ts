import { defineRelations } from "drizzle-orm";

import { applications, reviews } from "./applications";
import { account, session, ssoProvider, user, verification } from "./auth";
import { conversationMembers, conversations, messageReceipts, messages } from "./chat";
import { hospiEvents, hospiInvitations, votes } from "./events";
import { notifications, pushTokens } from "./notifications";
import { profilePhotos, profiles } from "./profiles";
import { housemates, roomPhotos, rooms } from "./rooms";
import { blocks, privateKeyBackups, publicKeys, reports } from "./security";

export const relations = defineRelations(
  {
    // Auth
    user,
    session,
    account,
    verification,
    ssoProvider,
    // Profiles
    profiles,
    profilePhotos,
    // Rooms
    rooms,
    roomPhotos,
    housemates,
    // Applications
    applications,
    reviews,
    // Events
    hospiEvents,
    hospiInvitations,
    votes,
    // Chat
    conversations,
    conversationMembers,
    messages,
    messageReceipts,
    // Security
    publicKeys,
    privateKeyBackups,
    reports,
    blocks,
    // Notifications
    pushTokens,
    notifications,
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
      housemates: r.many.housemates(),
      applications: r.many.applications(),
    },
    profilePhotos: {
      profile: r.one.profiles({
        from: r.profilePhotos.userId,
        to: r.profiles.id,
      }),
    },

    // ── Room relations ──
    rooms: {
      owner: r.one.profiles({
        from: r.rooms.ownerId,
        to: r.profiles.id,
      }),
      photos: r.many.roomPhotos(),
      housemates: r.many.housemates(),
      applications: r.many.applications(),
      reviews: r.many.reviews(),
      events: r.many.hospiEvents(),
      conversations: r.many.conversations(),
    },
    roomPhotos: {
      room: r.one.rooms({
        from: r.roomPhotos.roomId,
        to: r.rooms.id,
      }),
    },
    housemates: {
      room: r.one.rooms({
        from: r.housemates.roomId,
        to: r.rooms.id,
      }),
      user: r.one.profiles({
        from: r.housemates.userId,
        to: r.profiles.id,
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

    // ── Chat relations ──
    conversations: {
      room: r.one.rooms({
        from: r.conversations.roomId,
        to: r.rooms.id,
      }),
      members: r.many.conversationMembers(),
      messages: r.many.messages(),
    },
    conversationMembers: {
      conversation: r.one.conversations({
        from: r.conversationMembers.conversationId,
        to: r.conversations.id,
      }),
      user: r.one.profiles({
        from: r.conversationMembers.userId,
        to: r.profiles.id,
      }),
    },
    messages: {
      conversation: r.one.conversations({
        from: r.messages.conversationId,
        to: r.conversations.id,
      }),
      sender: r.one.profiles({
        from: r.messages.senderId,
        to: r.profiles.id,
      }),
      receipts: r.many.messageReceipts(),
    },
    messageReceipts: {
      message: r.one.messages({
        from: r.messageReceipts.messageId,
        to: r.messages.id,
      }),
      user: r.one.profiles({
        from: r.messageReceipts.userId,
        to: r.profiles.id,
      }),
    },

    // ── Security relations ──
    publicKeys: {
      user: r.one.profiles({
        from: r.publicKeys.userId,
        to: r.profiles.id,
      }),
    },
    privateKeyBackups: {
      user: r.one.profiles({
        from: r.privateKeyBackups.userId,
        to: r.profiles.id,
      }),
    },
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
      reportedMessage: r.one.messages({
        from: r.reports.reportedMessageId,
        to: r.messages.id,
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
    notifications: {
      user: r.one.profiles({
        from: r.notifications.userId,
        to: r.profiles.id,
      }),
    },
  }),
);
