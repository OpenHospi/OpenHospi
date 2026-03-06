import {
  AdminAction,
  ApplicationStatus,
  Gender,
  InvitationStatus,
  isTerminalApplicationStatus,
  isValidApplicationTransition,
  isValidInvitationTransition,
  isValidRoomTransition,
  LifestyleTag,
  ReportReason,
  ReportStatus,
  ReportType,
  ReviewDecision,
  RoomStatus,
  VALID_APPLICATION_TRANSITIONS,
  VALID_INVITATION_TRANSITIONS,
  VALID_ROOM_TRANSITIONS,
} from "@openhospi/shared/enums";
import { and, eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db } from "./db";
import { withRLS } from "./rls";
import {
  adminAuditLog,
  applications,
  blocks,
  conversationMembers,
  conversations,
  hospiEvents,
  hospiInvitations,
  houseMembers,
  houses,
  messageReceipts,
  messages,
  profiles,
  profilePhotos,
  publicKeys,
  reports,
  reviews,
  roomPhotos,
  rooms,
  user,
  votes,
} from "./schema";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Run a query as the anonymous role (no JWT claims, no auth). */
async function withAnonymous<T>(fn: (tx: Transaction) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    try {
      await tx.execute(sql`set local role anon`);
      return await fn(tx);
    } finally {
      await tx.execute(sql`reset role`);
    }
  });
}

// ---------------------------------------------------------------------------
// Deterministic test IDs — b0 prefix avoids collision with rls.test.ts (a0)
// ---------------------------------------------------------------------------

// Users
const HOSPI_OWNER = "b0000000-0000-4000-a000-000000000001";
const HOSPI_MATE = "b0000000-0000-4000-a000-000000000002";
const SEEKER_1 = "b0000000-0000-4000-a000-000000000003";
const SEEKER_2 = "b0000000-0000-4000-a000-000000000004";
const ADMIN_USER = "b0000000-0000-4000-a000-000000000005";
const OUTSIDER = "b0000000-0000-4000-a000-000000000006";

// Entities
const HOUSE_1 = "b0000000-0000-4000-a100-000000000001";
const ROOM_1 = "b0000000-0000-4000-b000-000000000001"; // active
const ROOM_DRAFT = "b0000000-0000-4000-b000-000000000002"; // draft → transitions
const EVENT_1 = "b0000000-0000-4000-c000-000000000001";
const CONV_1 = "b0000000-0000-4000-e000-000000000001";
const APP_1 = "b0000000-0000-4000-d000-000000000001"; // SEEKER_1 → ROOM_1

const ALL_USERS = [HOSPI_OWNER, HOSPI_MATE, SEEKER_1, SEEKER_2, ADMIN_USER, OUTSIDER];
const NOW = new Date();

// ---------------------------------------------------------------------------
// Seed & Cleanup
// ---------------------------------------------------------------------------

async function cleanup() {
  // Reverse FK order
  await db.delete(adminAuditLog).where(
    sql`${adminAuditLog.adminUserId} IN (${sql.join(
      ALL_USERS.map((u) => sql`${u}`),
      sql`, `,
    )})`,
  );
  await db.delete(reports).where(
    sql`${reports.reporterId} IN (${sql.join(
      ALL_USERS.map((u) => sql`${u}`),
      sql`, `,
    )})`,
  );
  for (const id of ALL_USERS) {
    await db.delete(blocks).where(eq(blocks.blockerId, id));
    await db.delete(publicKeys).where(eq(publicKeys.userId, id));
  }
  await db
    .delete(reviews)
    .where(sql`${reviews.roomId} IN (${sql`${ROOM_1}`}, ${sql`${ROOM_DRAFT}`})`);
  await db.delete(votes).where(sql`${votes.roomId} IN (${sql`${ROOM_1}`}, ${sql`${ROOM_DRAFT}`})`);
  await db
    .delete(applications)
    .where(sql`${applications.roomId} IN (${sql`${ROOM_1}`}, ${sql`${ROOM_DRAFT}`})`);
  await db.delete(conversations).where(eq(conversations.id, CONV_1));
  await db.delete(hospiEvents).where(eq(hospiEvents.id, EVENT_1));
  await db
    .delete(roomPhotos)
    .where(sql`${roomPhotos.roomId} IN (${sql`${ROOM_1}`}, ${sql`${ROOM_DRAFT}`})`);
  await db.delete(rooms).where(eq(rooms.id, ROOM_1));
  await db.delete(rooms).where(eq(rooms.id, ROOM_DRAFT));
  await db.delete(houses).where(eq(houses.id, HOUSE_1));
  for (const id of ALL_USERS) {
    await db.delete(profilePhotos).where(eq(profilePhotos.userId, id));
    await db.delete(profiles).where(eq(profiles.id, id));
    await db.delete(user).where(eq(user.id, id));
  }
}

describe("E2E workflow tests (integration)", () => {
  beforeAll(async () => {
    await cleanup();

    // Users
    await db.insert(user).values([
      {
        id: HOSPI_OWNER,
        name: "Hospi Owner",
        email: "e2e-owner@test.openhospi.nl",
        emailVerified: true,
        role: "user",
        createdAt: NOW,
        updatedAt: NOW,
      },
      {
        id: HOSPI_MATE,
        name: "Hospi Mate",
        email: "e2e-mate@test.openhospi.nl",
        emailVerified: true,
        role: "user",
        createdAt: NOW,
        updatedAt: NOW,
      },
      {
        id: SEEKER_1,
        name: "Seeker One",
        email: "e2e-seeker1@test.openhospi.nl",
        emailVerified: true,
        role: "user",
        createdAt: NOW,
        updatedAt: NOW,
      },
      {
        id: SEEKER_2,
        name: "Seeker Two",
        email: "e2e-seeker2@test.openhospi.nl",
        emailVerified: true,
        role: "user",
        createdAt: NOW,
        updatedAt: NOW,
      },
      {
        id: ADMIN_USER,
        name: "Admin User",
        email: "e2e-admin@test.openhospi.nl",
        emailVerified: true,
        role: "admin",
        createdAt: NOW,
        updatedAt: NOW,
      },
      {
        id: OUTSIDER,
        name: "Outsider",
        email: "e2e-outsider@test.openhospi.nl",
        emailVerified: true,
        role: "user",
        createdAt: NOW,
        updatedAt: NOW,
      },
    ]);

    // Profiles
    await db.insert(profiles).values([
      {
        id: HOSPI_OWNER,
        firstName: "Hospi",
        lastName: "Owner",
        email: "e2e-owner@test.openhospi.nl",
        institutionDomain: "test.nl",
      },
      {
        id: HOSPI_MATE,
        firstName: "Hospi",
        lastName: "Mate",
        email: "e2e-mate@test.openhospi.nl",
        institutionDomain: "test.nl",
      },
      {
        id: SEEKER_1,
        firstName: "Seeker",
        lastName: "One",
        email: "e2e-seeker1@test.openhospi.nl",
        institutionDomain: "test.nl",
      },
      {
        id: SEEKER_2,
        firstName: "Seeker",
        lastName: "Two",
        email: "e2e-seeker2@test.openhospi.nl",
        institutionDomain: "test.nl",
      },
      {
        id: ADMIN_USER,
        firstName: "Admin",
        lastName: "User",
        email: "e2e-admin@test.openhospi.nl",
        institutionDomain: "test.nl",
      },
      {
        id: OUTSIDER,
        firstName: "Out",
        lastName: "Sider",
        email: "e2e-outsider@test.openhospi.nl",
        institutionDomain: "test.nl",
      },
    ]);

    // House + members
    await db.insert(houses).values({ id: HOUSE_1, name: "E2E Test House", createdBy: HOSPI_OWNER });
    await db.insert(houseMembers).values([
      { houseId: HOUSE_1, userId: HOSPI_OWNER, role: "owner" },
      { houseId: HOUSE_1, userId: HOSPI_MATE, role: "member" },
    ]);

    // Rooms
    await db.insert(rooms).values([
      {
        id: ROOM_1,
        ownerId: HOSPI_OWNER,
        houseId: HOUSE_1,
        title: "E2E Active Room",
        city: "amsterdam",
        status: "active",
        rentPrice: "600",
        serviceCosts: "50",
        deposit: "1200",
      },
      {
        id: ROOM_DRAFT,
        ownerId: HOSPI_OWNER,
        houseId: HOUSE_1,
        title: "E2E Draft Room",
        city: "utrecht",
        status: "draft",
        rentPrice: "500",
      },
    ]);

    // Application: SEEKER_1 → ROOM_1
    await db.insert(applications).values({ id: APP_1, roomId: ROOM_1, userId: SEEKER_1 });

    // Event on ROOM_1
    await db.insert(hospiEvents).values({
      id: EVENT_1,
      roomId: ROOM_1,
      createdBy: HOSPI_OWNER,
      title: "E2E Meet & Greet",
      eventDate: "2026-04-01",
      timeStart: "14:00",
    });

    // Conversation: HOSPI_OWNER + SEEKER_1
    await db
      .insert(conversations)
      .values({ id: CONV_1, roomId: ROOM_1, seekerUserId: SEEKER_1, type: "direct" });
    await db.insert(conversationMembers).values([
      { conversationId: CONV_1, userId: HOSPI_OWNER },
      { conversationId: CONV_1, userId: SEEKER_1 },
    ]);
  });

  afterAll(async () => {
    await cleanup();
  });

  // -------------------------------------------------------------------------
  // 1. User lifecycle & onboarding workflow
  // -------------------------------------------------------------------------

  describe("user lifecycle & onboarding", () => {
    it("onboarding step 1: update about fields", async () => {
      const [updated] = await withRLS(SEEKER_1, (tx) =>
        tx
          .update(profiles)
          .set({
            gender: Gender.male,
            birthDate: "2000-01-15",
            studyProgram: "Computer Science",
            studyLevel: "wo_bachelor",
            bio: "Ik zoek een kamer in Amsterdam",
          })
          .where(eq(profiles.id, SEEKER_1))
          .returning(),
      );
      expect(updated.gender).toBe(Gender.male);
      expect(updated.birthDate).toBe("2000-01-15");
      expect(updated.studyProgram).toBe("Computer Science");
      expect(updated.studyLevel).toBe("wo_bachelor");
      expect(updated.bio).toBe("Ik zoek een kamer in Amsterdam");
      // Reset
      await db
        .update(profiles)
        .set({ gender: null, birthDate: null, studyProgram: null, studyLevel: null, bio: null })
        .where(eq(profiles.id, SEEKER_1));
    });

    it("onboarding step 2: set lifestyleTags array", async () => {
      const tags = [LifestyleTag.sociable, LifestyleTag.sports, LifestyleTag.cooking] as const;
      const [updated] = await withRLS(SEEKER_1, (tx) =>
        tx
          .update(profiles)
          .set({ lifestyleTags: [...tags] })
          .where(eq(profiles.id, SEEKER_1))
          .returning(),
      );
      expect(updated.lifestyleTags).toEqual([
        LifestyleTag.sociable,
        LifestyleTag.sports,
        LifestyleTag.cooking,
      ]);
      await db.update(profiles).set({ lifestyleTags: [] }).where(eq(profiles.id, SEEKER_1));
    });

    it("onboarding step 3: set preferences", async () => {
      const [updated] = await withRLS(SEEKER_1, (tx) =>
        tx
          .update(profiles)
          .set({
            preferredCity: "amsterdam",
          })
          .where(eq(profiles.id, SEEKER_1))
          .returning(),
      );
      expect(updated.preferredCity).toBe("amsterdam");
      await db.update(profiles).set({ preferredCity: null }).where(eq(profiles.id, SEEKER_1));
    });

    it("profile completion check: all required fields set", async () => {
      await db
        .update(profiles)
        .set({
          gender: Gender.male,
          birthDate: "2000-01-15",
          studyProgram: "CS",
          studyLevel: "wo_bachelor",
          bio: "Test",
          preferredCity: "amsterdam",
          lifestyleTags: [LifestyleTag.sociable],
        })
        .where(eq(profiles.id, SEEKER_1));

      const [p] = await withRLS(SEEKER_1, (tx) =>
        tx.select().from(profiles).where(eq(profiles.id, SEEKER_1)),
      );
      expect(p.gender).not.toBeNull();
      expect(p.birthDate).not.toBeNull();
      expect(p.studyProgram).not.toBeNull();
      expect(p.studyLevel).not.toBeNull();
      expect(p.bio).not.toBeNull();
      expect(p.preferredCity).not.toBeNull();

      await db
        .update(profiles)
        .set({
          gender: null,
          birthDate: null,
          studyProgram: null,
          studyLevel: null,
          bio: null,
          preferredCity: null,
          lifestyleTags: [],
        })
        .where(eq(profiles.id, SEEKER_1));
    });

    it("profile photo via RLS: own insert + any auth read", async () => {
      const [photo] = await withRLS(SEEKER_1, (tx) =>
        tx
          .insert(profilePhotos)
          .values({
            userId: SEEKER_1,
            slot: 0,
            url: "https://example.com/photo.jpg",
          })
          .returning(),
      );
      expect(photo.userId).toBe(SEEKER_1);

      // Any authenticated user can read profile photos
      const rows = await withRLS(OUTSIDER, (tx) =>
        tx.select().from(profilePhotos).where(eq(profilePhotos.userId, SEEKER_1)),
      );
      expect(rows).toHaveLength(1);

      await db.delete(profilePhotos).where(eq(profilePhotos.id, photo.id));
    });

    it("cannot insert profile photo for another user", async () => {
      await expect(
        withRLS(OUTSIDER, (tx) =>
          tx.insert(profilePhotos).values({
            userId: SEEKER_1,
            slot: 1,
            url: "https://example.com/hacked.jpg",
          }),
        ),
      ).rejects.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // 2. Room status state machine
  // -------------------------------------------------------------------------

  describe("room status state machine", () => {
    it("draft room not visible to anon", async () => {
      const rows = await withAnonymous((tx) => tx.select().from(rooms));
      const ids = rows.map((r) => r.id);
      expect(ids).not.toContain(ROOM_DRAFT);
    });

    it("transition: draft → active", async () => {
      expect(isValidRoomTransition(RoomStatus.draft, RoomStatus.active)).toBe(true);

      const [updated] = await withRLS(HOSPI_OWNER, (tx) =>
        tx
          .update(rooms)
          .set({ status: RoomStatus.active })
          .where(eq(rooms.id, ROOM_DRAFT))
          .returning(),
      );
      expect(updated.status).toBe(RoomStatus.active);

      // Anon can now see it
      const rows = await withAnonymous((tx) => tx.select().from(rooms));
      expect(rows.map((r) => r.id)).toContain(ROOM_DRAFT);
    });

    it("transition: active → paused", async () => {
      expect(isValidRoomTransition(RoomStatus.active, RoomStatus.paused)).toBe(true);

      await withRLS(HOSPI_OWNER, (tx) =>
        tx.update(rooms).set({ status: RoomStatus.paused }).where(eq(rooms.id, ROOM_DRAFT)),
      );

      // Anon no longer sees it
      const anonRows = await withAnonymous((tx) => tx.select().from(rooms));
      expect(anonRows.map((r) => r.id)).not.toContain(ROOM_DRAFT);

      // Owner still sees it
      const ownerRows = await withRLS(HOSPI_OWNER, (tx) => tx.select().from(rooms));
      expect(ownerRows.map((r) => r.id)).toContain(ROOM_DRAFT);
    });

    it("transition: paused → active", async () => {
      expect(isValidRoomTransition(RoomStatus.paused, RoomStatus.active)).toBe(true);

      await withRLS(HOSPI_OWNER, (tx) =>
        tx.update(rooms).set({ status: RoomStatus.active }).where(eq(rooms.id, ROOM_DRAFT)),
      );

      const anonRows = await withAnonymous((tx) => tx.select().from(rooms));
      expect(anonRows.map((r) => r.id)).toContain(ROOM_DRAFT);
    });

    it("transition: active → closed", async () => {
      expect(isValidRoomTransition(RoomStatus.active, RoomStatus.closed)).toBe(true);

      await withRLS(HOSPI_OWNER, (tx) =>
        tx.update(rooms).set({ status: RoomStatus.closed }).where(eq(rooms.id, ROOM_DRAFT)),
      );

      const anonRows = await withAnonymous((tx) => tx.select().from(rooms));
      expect(anonRows.map((r) => r.id)).not.toContain(ROOM_DRAFT);
    });

    it("invalid: closed → active", async () => {
      expect(isValidRoomTransition(RoomStatus.closed, RoomStatus.active)).toBe(false);
    });

    it("generated column totalCost computes correctly", async () => {
      // ROOM_1 was seeded with rentPrice=600, serviceCosts=50
      const [r] = await db.select().from(rooms).where(eq(rooms.id, ROOM_1));
      expect(r.totalCost).toBe("650.00");
      expect(typeof r.totalCost).toBe("string");

      // Room with null serviceCosts → totalCost = rentPrice
      const [r2] = await db.select().from(rooms).where(eq(rooms.id, ROOM_DRAFT));
      expect(r2.totalCost).toBe("500.00");
    });
  });

  // -------------------------------------------------------------------------
  // 3. Application lifecycle workflow
  // -------------------------------------------------------------------------

  describe("application lifecycle", () => {
    it("seeker application defaults to sent status", async () => {
      const [app] = await withRLS(SEEKER_1, (tx) =>
        tx.select().from(applications).where(eq(applications.id, APP_1)),
      );
      expect(app.status).toBe(ApplicationStatus.sent);
    });

    it("duplicate application throws (unique constraint)", async () => {
      await expect(
        db.insert(applications).values({ roomId: ROOM_1, userId: SEEKER_1 }),
      ).rejects.toThrow();
    });

    it("owner sees application for their room", async () => {
      const rows = await withRLS(HOSPI_OWNER, (tx) =>
        tx.select().from(applications).where(eq(applications.roomId, ROOM_1)),
      );
      expect(rows.length).toBeGreaterThanOrEqual(1);
      expect(rows.map((a) => a.userId)).toContain(SEEKER_1);
    });

    it("outsider cannot see applications", async () => {
      const rows = await withRLS(OUTSIDER, (tx) =>
        tx.select().from(applications).where(eq(applications.roomId, ROOM_1)),
      );
      expect(rows).toHaveLength(0);
    });

    it("full application state machine walk-through", async () => {
      // Create temp application: SEEKER_2 → ROOM_1
      const [tempApp] = await db
        .insert(applications)
        .values({
          roomId: ROOM_1,
          userId: SEEKER_2,
        })
        .returning();

      try {
        // sent → seen (hospi-side)
        expect(isValidApplicationTransition(ApplicationStatus.sent, ApplicationStatus.seen)).toBe(
          true,
        );
        await withRLS(HOSPI_OWNER, (tx) =>
          tx
            .update(applications)
            .set({ status: ApplicationStatus.seen })
            .where(eq(applications.id, tempApp.id)),
        );

        // seen → liked (hospi-side)
        expect(isValidApplicationTransition(ApplicationStatus.seen, ApplicationStatus.liked)).toBe(
          true,
        );
        await withRLS(HOSPI_OWNER, (tx) =>
          tx
            .update(applications)
            .set({ status: ApplicationStatus.liked })
            .where(eq(applications.id, tempApp.id)),
        );

        // liked → hospi (hospi-side)
        expect(isValidApplicationTransition(ApplicationStatus.liked, ApplicationStatus.hospi)).toBe(
          true,
        );
        await withRLS(HOSPI_OWNER, (tx) =>
          tx
            .update(applications)
            .set({ status: ApplicationStatus.hospi })
            .where(eq(applications.id, tempApp.id)),
        );

        // hospi → accepted (hospi-side)
        expect(
          isValidApplicationTransition(ApplicationStatus.hospi, ApplicationStatus.accepted),
        ).toBe(true);
        await withRLS(HOSPI_OWNER, (tx) =>
          tx
            .update(applications)
            .set({ status: ApplicationStatus.accepted })
            .where(eq(applications.id, tempApp.id)),
        );

        // Verify final state
        const [final] = await db.select().from(applications).where(eq(applications.id, tempApp.id));
        expect(final.status).toBe(ApplicationStatus.accepted);
      } finally {
        await db.delete(applications).where(eq(applications.id, tempApp.id));
      }
    });

    it("terminal status has no valid transitions", async () => {
      expect(isTerminalApplicationStatus(ApplicationStatus.accepted)).toBe(true);
      expect(isTerminalApplicationStatus(ApplicationStatus.rejected)).toBe(true);
      expect(isTerminalApplicationStatus(ApplicationStatus.withdrawn)).toBe(true);
      expect(isTerminalApplicationStatus(ApplicationStatus.not_chosen)).toBe(true);

      // No transitions from terminal statuses
      expect(VALID_APPLICATION_TRANSITIONS[ApplicationStatus.accepted]).toHaveLength(0);
      expect(VALID_APPLICATION_TRANSITIONS[ApplicationStatus.withdrawn]).toHaveLength(0);
    });

    it("seeker withdraws application", async () => {
      const [tempApp] = await db
        .insert(applications)
        .values({
          roomId: ROOM_1,
          userId: SEEKER_2,
        })
        .returning();

      try {
        expect(
          isValidApplicationTransition(ApplicationStatus.sent, ApplicationStatus.withdrawn),
        ).toBe(true);
        await withRLS(SEEKER_2, (tx) =>
          tx
            .update(applications)
            .set({ status: ApplicationStatus.withdrawn })
            .where(eq(applications.id, tempApp.id)),
        );

        const [withdrawn] = await db
          .select()
          .from(applications)
          .where(eq(applications.id, tempApp.id));
        expect(withdrawn.status).toBe(ApplicationStatus.withdrawn);
        expect(isTerminalApplicationStatus(ApplicationStatus.withdrawn)).toBe(true);
      } finally {
        await db.delete(applications).where(eq(applications.id, tempApp.id));
      }
    });

    it("review: house member inserts, room members can read, outsider cannot", async () => {
      const [review] = await withRLS(HOSPI_MATE, (tx) =>
        tx
          .insert(reviews)
          .values({
            roomId: ROOM_1,
            reviewerId: HOSPI_MATE,
            applicantId: SEEKER_1,
            decision: ReviewDecision.like,
            notes: "Great fit!",
          })
          .returning(),
      );

      try {
        // Other room member can read
        const ownerRows = await withRLS(HOSPI_OWNER, (tx) =>
          tx.select().from(reviews).where(eq(reviews.roomId, ROOM_1)),
        );
        expect(ownerRows.length).toBeGreaterThanOrEqual(1);

        // Outsider cannot read
        const outsiderRows = await withRLS(OUTSIDER, (tx) =>
          tx.select().from(reviews).where(eq(reviews.roomId, ROOM_1)),
        );
        expect(outsiderRows).toHaveLength(0);
      } finally {
        await db.delete(reviews).where(eq(reviews.id, review.id));
      }
    });

    it("review unique constraint: same reviewer + applicant + room throws", async () => {
      const [review] = await db
        .insert(reviews)
        .values({
          roomId: ROOM_1,
          reviewerId: HOSPI_MATE,
          applicantId: SEEKER_1,
          decision: ReviewDecision.like,
        })
        .returning();

      try {
        await expect(
          db.insert(reviews).values({
            roomId: ROOM_1,
            reviewerId: HOSPI_MATE,
            applicantId: SEEKER_1,
            decision: ReviewDecision.reject,
          }),
        ).rejects.toThrow();
      } finally {
        await db.delete(reviews).where(eq(reviews.id, review.id));
      }
    });
  });

  // -------------------------------------------------------------------------
  // 4. Event & voting system
  // -------------------------------------------------------------------------

  describe("event & voting system", () => {
    it("event visible to house members, not outsider", async () => {
      const mateRows = await withRLS(HOSPI_MATE, (tx) =>
        tx.select().from(hospiEvents).where(eq(hospiEvents.id, EVENT_1)),
      );
      expect(mateRows).toHaveLength(1);

      const outsiderRows = await withRLS(OUTSIDER, (tx) =>
        tx.select().from(hospiEvents).where(eq(hospiEvents.id, EVENT_1)),
      );
      expect(outsiderRows).toHaveLength(0);
    });

    it("creator invites seeker → invitee sees invitation", async () => {
      const [inv] = await withRLS(HOSPI_OWNER, (tx) =>
        tx
          .insert(hospiInvitations)
          .values({
            eventId: EVENT_1,
            userId: SEEKER_1,
          })
          .returning(),
      );

      try {
        expect(inv.status).toBe(InvitationStatus.pending);

        // Invitee sees own invitation
        const seekerRows = await withRLS(SEEKER_1, (tx) =>
          tx.select().from(hospiInvitations).where(eq(hospiInvitations.id, inv.id)),
        );
        expect(seekerRows).toHaveLength(1);
      } finally {
        await db.delete(hospiInvitations).where(eq(hospiInvitations.id, inv.id));
      }
    });

    it("RSVP walk-through: pending → attending → not_attending (terminal)", async () => {
      const [inv] = await db
        .insert(hospiInvitations)
        .values({
          eventId: EVENT_1,
          userId: SEEKER_1,
        })
        .returning();

      try {
        // pending → attending
        expect(
          isValidInvitationTransition(InvitationStatus.pending, InvitationStatus.attending),
        ).toBe(true);
        await withRLS(SEEKER_1, (tx) =>
          tx
            .update(hospiInvitations)
            .set({ status: InvitationStatus.attending })
            .where(eq(hospiInvitations.id, inv.id)),
        );

        // attending → not_attending
        expect(
          isValidInvitationTransition(InvitationStatus.attending, InvitationStatus.not_attending),
        ).toBe(true);
        await withRLS(SEEKER_1, (tx) =>
          tx
            .update(hospiInvitations)
            .set({ status: InvitationStatus.not_attending })
            .where(eq(hospiInvitations.id, inv.id)),
        );

        // not_attending is terminal
        expect(VALID_INVITATION_TRANSITIONS[InvitationStatus.not_attending]).toHaveLength(0);
      } finally {
        await db.delete(hospiInvitations).where(eq(hospiInvitations.id, inv.id));
      }
    });

    it("duplicate invitation throws (unique constraint)", async () => {
      const [inv] = await db
        .insert(hospiInvitations)
        .values({
          eventId: EVENT_1,
          userId: SEEKER_2,
        })
        .returning();

      try {
        await expect(
          db.insert(hospiInvitations).values({ eventId: EVENT_1, userId: SEEKER_2 }),
        ).rejects.toThrow();
      } finally {
        await db.delete(hospiInvitations).where(eq(hospiInvitations.id, inv.id));
      }
    });

    it("vote insert + room member access + outsider denied", async () => {
      const [vote] = await withRLS(HOSPI_MATE, (tx) =>
        tx
          .insert(votes)
          .values({
            roomId: ROOM_1,
            voterId: HOSPI_MATE,
            applicantId: SEEKER_1,
            rank: 1,
            round: 1,
          })
          .returning(),
      );

      try {
        // Room member (owner) sees votes
        const ownerRows = await withRLS(HOSPI_OWNER, (tx) =>
          tx.select().from(votes).where(eq(votes.roomId, ROOM_1)),
        );
        expect(ownerRows.length).toBeGreaterThanOrEqual(1);

        // Outsider cannot
        const outsiderRows = await withRLS(OUTSIDER, (tx) =>
          tx.select().from(votes).where(eq(votes.roomId, ROOM_1)),
        );
        expect(outsiderRows).toHaveLength(0);
      } finally {
        await db.delete(votes).where(eq(votes.id, vote.id));
      }
    });

    it("vote unique constraint: same voter + applicant + room + round throws", async () => {
      const [vote] = await db
        .insert(votes)
        .values({
          roomId: ROOM_1,
          voterId: HOSPI_MATE,
          applicantId: SEEKER_1,
          rank: 1,
          round: 1,
        })
        .returning();

      try {
        await expect(
          db.insert(votes).values({
            roomId: ROOM_1,
            voterId: HOSPI_MATE,
            applicantId: SEEKER_1,
            rank: 2,
            round: 1,
          }),
        ).rejects.toThrow();
      } finally {
        await db.delete(votes).where(eq(votes.id, vote.id));
      }
    });
  });

  // -------------------------------------------------------------------------
  // 5. Chat workflow at database level
  // -------------------------------------------------------------------------

  describe("chat workflow", () => {
    it("member sends encrypted message", async () => {
      const [msg] = await withRLS(HOSPI_OWNER, (tx) =>
        tx
          .insert(messages)
          .values({
            conversationId: CONV_1,
            senderId: HOSPI_OWNER,
            ciphertext: "e2e-encrypted-payload",
            iv: "e2e-iv-001",
            encryptedKeys: [{ recipientId: SEEKER_1, key: "wrapped-key-001" }],
          })
          .returning(),
      );

      try {
        expect(msg.ciphertext).toBe("e2e-encrypted-payload");
        expect(msg.encryptedKeys).toEqual([{ recipientId: SEEKER_1, key: "wrapped-key-001" }]);
      } finally {
        await db.delete(messages).where(eq(messages.id, msg.id));
      }
    });

    it("co-member reads messages in conversation", async () => {
      const [msg] = await db
        .insert(messages)
        .values({
          conversationId: CONV_1,
          senderId: HOSPI_OWNER,
          ciphertext: "read-test",
          iv: "read-iv",
        })
        .returning();

      try {
        const rows = await withRLS(SEEKER_1, (tx) =>
          tx.select().from(messages).where(eq(messages.conversationId, CONV_1)),
        );
        expect(rows.length).toBeGreaterThanOrEqual(1);
        expect(rows.map((m) => m.id)).toContain(msg.id);
      } finally {
        await db.delete(messages).where(eq(messages.id, msg.id));
      }
    });

    it("non-member cannot read messages", async () => {
      const rows = await withRLS(OUTSIDER, (tx) =>
        tx.select().from(messages).where(eq(messages.conversationId, CONV_1)),
      );
      expect(rows).toHaveLength(0);
    });

    it("cannot spoof senderId", async () => {
      await expect(
        withRLS(SEEKER_1, (tx) =>
          tx.insert(messages).values({
            conversationId: CONV_1,
            senderId: HOSPI_OWNER,
            ciphertext: "spoofed",
            iv: "spoofed-iv",
          }),
        ),
      ).rejects.toThrow();
    });

    it("receipt tracking: insert, update to read, own-only visibility", async () => {
      const [msg] = await db
        .insert(messages)
        .values({
          conversationId: CONV_1,
          senderId: HOSPI_OWNER,
          ciphertext: "receipt-test",
          iv: "receipt-iv",
        })
        .returning();

      try {
        // SEEKER_1 inserts receipt
        await withRLS(SEEKER_1, (tx) =>
          tx.insert(messageReceipts).values({
            messageId: msg.id,
            userId: SEEKER_1,
            status: "delivered",
          }),
        );

        // Update to read
        const [receipt] = await withRLS(SEEKER_1, (tx) =>
          tx
            .update(messageReceipts)
            .set({ status: "read", readAt: new Date() })
            .where(and(eq(messageReceipts.messageId, msg.id), eq(messageReceipts.userId, SEEKER_1)))
            .returning(),
        );
        expect(receipt.status).toBe("read");
        expect(receipt.readAt).not.toBeNull();

        // Only SEEKER_1 sees the receipt
        const outsiderReceipts = await withRLS(OUTSIDER, (tx) =>
          tx.select().from(messageReceipts).where(eq(messageReceipts.messageId, msg.id)),
        );
        expect(outsiderReceipts).toHaveLength(0);
      } finally {
        await db.delete(messages).where(eq(messages.id, msg.id));
      }
    });

    it("mute toggle on conversation membership", async () => {
      await withRLS(SEEKER_1, (tx) =>
        tx
          .update(conversationMembers)
          .set({ muted: true })
          .where(
            and(
              eq(conversationMembers.conversationId, CONV_1),
              eq(conversationMembers.userId, SEEKER_1),
            ),
          ),
      );

      const [member] = await db
        .select()
        .from(conversationMembers)
        .where(
          and(
            eq(conversationMembers.conversationId, CONV_1),
            eq(conversationMembers.userId, SEEKER_1),
          ),
        );
      expect(member.muted).toBe(true);

      // Reset
      await db
        .update(conversationMembers)
        .set({ muted: false })
        .where(
          and(
            eq(conversationMembers.conversationId, CONV_1),
            eq(conversationMembers.userId, SEEKER_1),
          ),
        );
    });

    it("conversation cascade: delete removes members, messages, receipts", async () => {
      const [conv] = await db.insert(conversations).values({ type: "direct" }).returning();
      await db.insert(conversationMembers).values([
        { conversationId: conv.id, userId: HOSPI_OWNER },
        { conversationId: conv.id, userId: SEEKER_2 },
      ]);
      const [msg] = await db
        .insert(messages)
        .values({
          conversationId: conv.id,
          senderId: HOSPI_OWNER,
          ciphertext: "cascade",
          iv: "cascade-iv",
        })
        .returning();
      await db.insert(messageReceipts).values({
        messageId: msg.id,
        userId: SEEKER_2,
        status: "delivered",
      });

      // Delete conversation
      await db.delete(conversations).where(eq(conversations.id, conv.id));

      // Verify cascaded deletes
      const members = await db
        .select()
        .from(conversationMembers)
        .where(eq(conversationMembers.conversationId, conv.id));
      expect(members).toHaveLength(0);

      const msgs = await db.select().from(messages).where(eq(messages.conversationId, conv.id));
      expect(msgs).toHaveLength(0);

      const receipts = await db
        .select()
        .from(messageReceipts)
        .where(eq(messageReceipts.messageId, msg.id));
      expect(receipts).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // 6. Security & moderation
  // -------------------------------------------------------------------------

  describe("security & moderation", () => {
    it("block flow: blocker sees, blocked user cannot, then unblock", async () => {
      await withRLS(SEEKER_1, (tx) =>
        tx.insert(blocks).values({ blockerId: SEEKER_1, blockedId: SEEKER_2 }),
      );

      // SEEKER_1 sees the block
      const s1Blocks = await withRLS(SEEKER_1, (tx) =>
        tx.select().from(blocks).where(eq(blocks.blockerId, SEEKER_1)),
      );
      expect(s1Blocks).toHaveLength(1);
      expect(s1Blocks[0].blockedId).toBe(SEEKER_2);

      // SEEKER_2 cannot see blocks
      const s2Blocks = await withRLS(SEEKER_2, (tx) => tx.select().from(blocks));
      expect(s2Blocks).toHaveLength(0);

      // Unblock
      await withRLS(SEEKER_1, (tx) =>
        tx
          .delete(blocks)
          .where(and(eq(blocks.blockerId, SEEKER_1), eq(blocks.blockedId, SEEKER_2))),
      );
    });

    it("cannot block as another user", async () => {
      await expect(
        withRLS(SEEKER_1, (tx) =>
          tx.insert(blocks).values({ blockerId: SEEKER_2, blockedId: OUTSIDER }),
        ),
      ).rejects.toThrow();
    });

    it("report flow: reporter sees, reported user cannot", async () => {
      const [report] = await withRLS(SEEKER_1, (tx) =>
        tx
          .insert(reports)
          .values({
            reportType: ReportType.user,
            reporterId: SEEKER_1,
            reportedUserId: SEEKER_2,
            reason: ReportReason.harassment,
            description: "E2E test report",
          })
          .returning(),
      );

      try {
        // Reporter sees own report
        const reporterRows = await withRLS(SEEKER_1, (tx) =>
          tx.select().from(reports).where(eq(reports.id, report.id)),
        );
        expect(reporterRows).toHaveLength(1);

        // Reported user cannot
        const reportedRows = await withRLS(SEEKER_2, (tx) =>
          tx.select().from(reports).where(eq(reports.id, report.id)),
        );
        expect(reportedRows).toHaveLength(0);
      } finally {
        await db.delete(reports).where(eq(reports.id, report.id));
      }
    });

    it("admin sees all reports", async () => {
      const [report] = await db
        .insert(reports)
        .values({
          reportType: ReportType.user,
          reporterId: SEEKER_1,
          reportedUserId: SEEKER_2,
          reason: ReportReason.spam,
          description: "Admin visibility test",
        })
        .returning();

      try {
        const adminRows = await withRLS(ADMIN_USER, (tx) =>
          tx.select().from(reports).where(eq(reports.id, report.id)),
        );
        expect(adminRows).toHaveLength(1);
      } finally {
        await db.delete(reports).where(eq(reports.id, report.id));
      }
    });

    it("admin resolves report, non-admin cannot", async () => {
      const [report] = await db
        .insert(reports)
        .values({
          reportType: ReportType.user,
          reporterId: SEEKER_1,
          reportedUserId: SEEKER_2,
          reason: ReportReason.fake_profile,
          description: "Resolve test",
        })
        .returning();

      try {
        // Admin resolves
        const [resolved] = await withRLS(ADMIN_USER, (tx) =>
          tx
            .update(reports)
            .set({ status: ReportStatus.resolved })
            .where(eq(reports.id, report.id))
            .returning(),
        );
        expect(resolved.status).toBe(ReportStatus.resolved);

        // Reset to pending for the non-admin test
        await db
          .update(reports)
          .set({ status: ReportStatus.pending })
          .where(eq(reports.id, report.id));

        // Non-admin cannot update
        const result = await withRLS(SEEKER_1, (tx) =>
          tx
            .update(reports)
            .set({ status: ReportStatus.resolved })
            .where(eq(reports.id, report.id))
            .returning(),
        );
        expect(result).toHaveLength(0);
      } finally {
        await db.delete(reports).where(eq(reports.id, report.id));
      }
    });

    it("public key: insert own, read all, cannot insert for another", async () => {
      await withRLS(SEEKER_2, (tx) =>
        tx
          .insert(publicKeys)
          .values({
            userId: SEEKER_2,
            publicKeyJwk: { kty: "EC", crv: "P-256", x: "e2e-x", y: "e2e-y" },
          })
          .returning(),
      );

      try {
        // Any authenticated user can read
        const rows = await withRLS(OUTSIDER, (tx) => tx.select().from(publicKeys));
        expect(rows.map((r) => r.userId)).toContain(SEEKER_2);

        // Cannot insert for another user
        await expect(
          withRLS(SEEKER_1, (tx) =>
            tx.insert(publicKeys).values({
              userId: OUTSIDER,
              publicKeyJwk: { kty: "EC", crv: "P-256", x: "fake", y: "fake" },
            }),
          ),
        ).rejects.toThrow();
      } finally {
        await db.delete(publicKeys).where(eq(publicKeys.userId, SEEKER_2));
      }
    });

    it("admin audit log: admin inserts + reads, non-admin blocked", async () => {
      const [entry] = await withRLS(ADMIN_USER, (tx) =>
        tx
          .insert(adminAuditLog)
          .values({
            adminUserId: ADMIN_USER,
            action: AdminAction.view_report,
            targetType: "report",
            reason: "E2E test audit entry",
          })
          .returning(),
      );

      try {
        // Admin reads
        const adminRows = await withRLS(ADMIN_USER, (tx) =>
          tx.select().from(adminAuditLog).where(eq(adminAuditLog.id, entry.id)),
        );
        expect(adminRows).toHaveLength(1);

        // Non-admin cannot read
        const seekerRows = await withRLS(SEEKER_1, (tx) =>
          tx.select().from(adminAuditLog).where(eq(adminAuditLog.id, entry.id)),
        );
        expect(seekerRows).toHaveLength(0);

        // Non-admin cannot insert
        await expect(
          withRLS(SEEKER_1, (tx) =>
            tx.insert(adminAuditLog).values({
              adminUserId: SEEKER_1,
              action: AdminAction.suspend_user,
              reason: "should fail",
            }),
          ),
        ).rejects.toThrow();
      } finally {
        await db.delete(adminAuditLog).where(eq(adminAuditLog.id, entry.id));
      }
    });
  });

  // -------------------------------------------------------------------------
  // 7. Cross-cutting: generated columns & state validators
  // -------------------------------------------------------------------------

  describe("cross-cutting: numeric columns & state validators", () => {
    it("room numeric columns return as strings", async () => {
      const [r] = await db.select().from(rooms).where(eq(rooms.id, ROOM_1));
      expect(typeof r.rentPrice).toBe("string");
      expect(typeof r.deposit).toBe("string");
      expect(typeof r.serviceCosts).toBe("string");
      expect(typeof r.totalCost).toBe("string");
    });

    it("room photo RLS: owner inserts, any auth reads, non-owner cannot insert", async () => {
      const [photo] = await withRLS(HOSPI_OWNER, (tx) =>
        tx
          .insert(roomPhotos)
          .values({
            roomId: ROOM_1,
            slot: 0,
            url: "https://example.com/room.jpg",
          })
          .returning(),
      );

      try {
        // Any authenticated user can read room photos
        const rows = await withRLS(OUTSIDER, (tx) =>
          tx.select().from(roomPhotos).where(eq(roomPhotos.roomId, ROOM_1)),
        );
        expect(rows).toHaveLength(1);

        // Non-owner cannot insert
        await expect(
          withRLS(OUTSIDER, (tx) =>
            tx.insert(roomPhotos).values({
              roomId: ROOM_1,
              slot: 1,
              url: "https://example.com/hacked.jpg",
            }),
          ),
        ).rejects.toThrow();
      } finally {
        await db.delete(roomPhotos).where(eq(roomPhotos.id, photo.id));
      }
    });

    it("exhaustive room transitions: all valid pairs true, all invalid false", async () => {
      for (const from of RoomStatus.values) {
        for (const to of RoomStatus.values) {
          const expected = VALID_ROOM_TRANSITIONS[from].includes(to);
          expect(isValidRoomTransition(from, to)).toBe(expected);
        }
      }
    });

    it("exhaustive application transitions: all valid pairs true, all invalid false", async () => {
      for (const from of ApplicationStatus.values) {
        for (const to of ApplicationStatus.values) {
          const expected = VALID_APPLICATION_TRANSITIONS[from].includes(to);
          expect(isValidApplicationTransition(from, to)).toBe(expected);
        }
      }
    });

    it("exhaustive invitation transitions: all valid pairs true, all invalid false", async () => {
      for (const from of InvitationStatus.values) {
        for (const to of InvitationStatus.values) {
          const expected = VALID_INVITATION_TRANSITIONS[from].includes(to);
          expect(isValidInvitationTransition(from, to)).toBe(expected);
        }
      }
    });
  });
});
