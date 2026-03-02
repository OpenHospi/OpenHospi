import { eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db } from "./db";
import { withRLS } from "./rls";
import {
  applications,
  blocks,
  conversations,
  conversationMembers,
  hospiEvents,
  hospiInvitations,
  houseMembers,
  houses,
  messageReceipts,
  messages,
  privateKeyBackups,
  profiles,
  publicKeys,
  reports,
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
// Deterministic test IDs (prefixed to avoid collision with real data)
// ---------------------------------------------------------------------------

const USER_A = "a0000000-0000-4000-a000-000000000001"; // room owner, event creator
const USER_B = "a0000000-0000-4000-a000-000000000002"; // housemate of room
const USER_C = "a0000000-0000-4000-a000-000000000003"; // outsider

const HOUSE_ID = "a0000000-0000-4000-a100-000000000001";
const ACTIVE_ROOM = "a0000000-0000-4000-b000-000000000001";
const DRAFT_ROOM = "a0000000-0000-4000-b000-000000000002";
const EVENT_ID = "a0000000-0000-4000-c000-000000000001";
const INVITATION_ID = "a0000000-0000-4000-d000-000000000001";
const CONVERSATION_ID = "a0000000-0000-4000-e000-000000000001";
const MESSAGE_ID = "a0000000-0000-4000-f000-000000000001";
const VOTE_ID = "a0000000-0000-4000-f100-000000000001";
const REPORT_ID = "a0000000-0000-4000-f200-000000000001";

// Second conversation for constraint tests
const CONVERSATION_ID2 = "a0000000-0000-4000-e000-000000000002";

const NOW = new Date();

// ---------------------------------------------------------------------------
// Seed & Cleanup
// ---------------------------------------------------------------------------

/** Delete all test data (safe to call even if data doesn't exist). */
async function cleanup() {
  await db.delete(reports).where(eq(reports.id, REPORT_ID));
  for (const id of [USER_A, USER_B, USER_C]) {
    await db.delete(blocks).where(eq(blocks.blockerId, id));
    await db.delete(privateKeyBackups).where(eq(privateKeyBackups.userId, id));
    await db.delete(publicKeys).where(eq(publicKeys.userId, id));
  }
  await db.delete(votes).where(eq(votes.id, VOTE_ID));
  await db.delete(conversations).where(eq(conversations.id, CONVERSATION_ID));
  await db.delete(conversations).where(eq(conversations.id, CONVERSATION_ID2));
  await db.delete(hospiEvents).where(eq(hospiEvents.id, EVENT_ID));
  await db.delete(rooms).where(eq(rooms.id, ACTIVE_ROOM));
  await db.delete(rooms).where(eq(rooms.id, DRAFT_ROOM));
  await db.delete(houses).where(eq(houses.id, HOUSE_ID));
  for (const id of [USER_A, USER_B, USER_C]) {
    await db.delete(profiles).where(eq(profiles.id, id));
    await db.delete(user).where(eq(user.id, id));
  }
}

describe("RLS policies (integration)", () => {
  beforeAll(async () => {
    // Clean up any leftovers from a previous failed run
    await cleanup();

    // Seed using owner role (bypasses RLS)
    await db.insert(user).values([
      { id: USER_A, name: "User A", email: "rls-a@test.openhospi.nl", emailVerified: true, createdAt: NOW, updatedAt: NOW },
      { id: USER_B, name: "User B", email: "rls-b@test.openhospi.nl", emailVerified: true, createdAt: NOW, updatedAt: NOW },
      { id: USER_C, name: "User C", email: "rls-c@test.openhospi.nl", emailVerified: true, createdAt: NOW, updatedAt: NOW },
    ]);

    await db.insert(profiles).values([
      { id: USER_A, firstName: "User", lastName: "A", email: "rls-a@test.openhospi.nl", institutionDomain: "test.nl" },
      { id: USER_B, firstName: "User", lastName: "B", email: "rls-b@test.openhospi.nl", institutionDomain: "test.nl" },
      { id: USER_C, firstName: "User", lastName: "C", email: "rls-c@test.openhospi.nl", institutionDomain: "test.nl" },
    ]);

    await db.insert(houses).values({
      id: HOUSE_ID,
      name: "RLS Test House",
      createdBy: USER_A,
    });

    await db.insert(houseMembers).values([
      { houseId: HOUSE_ID, userId: USER_A, role: "owner" },
      { houseId: HOUSE_ID, userId: USER_B, role: "member" },
    ]);

    await db.insert(rooms).values([
      { id: ACTIVE_ROOM, ownerId: USER_A, houseId: HOUSE_ID, title: "RLS Active Room", city: "amsterdam", status: "active" },
      { id: DRAFT_ROOM, ownerId: USER_A, houseId: HOUSE_ID, title: "RLS Draft Room", city: "amsterdam", status: "draft" },
    ]);

    await db.insert(hospiEvents).values({
      id: EVENT_ID, roomId: ACTIVE_ROOM, createdBy: USER_A,
      title: "RLS Test Event", eventDate: "2026-03-01", timeStart: "10:00",
    });

    await db.insert(hospiInvitations).values({
      id: INVITATION_ID, eventId: EVENT_ID, userId: USER_B,
    });

    await db.insert(conversations).values({ id: CONVERSATION_ID, type: "direct" });
    await db.insert(conversationMembers).values([
      { conversationId: CONVERSATION_ID, userId: USER_A },
      { conversationId: CONVERSATION_ID, userId: USER_B },
    ]);

    await db.insert(messages).values({
      id: MESSAGE_ID, conversationId: CONVERSATION_ID, senderId: USER_A,
      ciphertext: "encrypted-test", iv: "iv-test", messageType: "text",
    });

    await db.insert(messageReceipts).values({
      messageId: MESSAGE_ID, userId: USER_A, status: "delivered",
    });

    await db.insert(votes).values({
      id: VOTE_ID, roomId: ACTIVE_ROOM, voterId: USER_A, applicantId: USER_B, rank: 1, round: 1,
    });

    // Security tables seed
    await db.insert(publicKeys).values([
      { userId: USER_A, publicKeyJwk: { kty: "EC", crv: "P-256", x: "test-x-a", y: "test-y-a" } },
      { userId: USER_B, publicKeyJwk: { kty: "EC", crv: "P-256", x: "test-x-b", y: "test-y-b" } },
    ]);

    await db.insert(privateKeyBackups).values({
      userId: USER_A, encryptedPrivateKey: "enc-key-a", backupIv: "iv-a", salt: "salt-a",
    });

    await db.insert(blocks).values({ blockerId: USER_A, blockedId: USER_B });

    await db.insert(reports).values({
      id: REPORT_ID, reportType: "user", reporterId: USER_A, reportedUserId: USER_B, reason: "spam", description: "test report",
    });
  });

  afterAll(async () => {
    await cleanup();
  });

  // -------------------------------------------------------------------------
  // Profiles — any authenticated can read, only own can update
  // -------------------------------------------------------------------------

  describe("profiles", () => {
    it("authenticated user can read all profiles", async () => {
      const rows = await withRLS(USER_C, (tx) => tx.select().from(profiles));
      const ids = rows.map((r) => r.id);
      expect(ids).toContain(USER_A);
      expect(ids).toContain(USER_B);
      expect(ids).toContain(USER_C);
    });

    it("user can update own profile", async () => {
      const [updated] = await withRLS(USER_A, (tx) =>
        tx.update(profiles).set({ bio: "rls-test" }).where(eq(profiles.id, USER_A)).returning(),
      );
      expect(updated.bio).toBe("rls-test");
      // Reset
      await db.update(profiles).set({ bio: null }).where(eq(profiles.id, USER_A));
    });

    it("user cannot update another user's profile", async () => {
      const result = await withRLS(USER_B, (tx) =>
        tx.update(profiles).set({ bio: "hacked" }).where(eq(profiles.id, USER_A)).returning(),
      );
      expect(result).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // Rooms — anonymous sees active only, owner sees all own, non-owner cannot update
  // -------------------------------------------------------------------------

  describe("rooms", () => {
    it("anonymous can see active rooms", async () => {
      const rows = await withAnonymous((tx) => tx.select().from(rooms));
      const ids = rows.map((r) => r.id);
      expect(ids).toContain(ACTIVE_ROOM);
    });

    it("anonymous cannot see draft rooms", async () => {
      const rows = await withAnonymous((tx) => tx.select().from(rooms));
      const ids = rows.map((r) => r.id);
      expect(ids).not.toContain(DRAFT_ROOM);
    });

    it("owner can see own draft rooms", async () => {
      const rows = await withRLS(USER_A, (tx) => tx.select().from(rooms));
      const ids = rows.map((r) => r.id);
      expect(ids).toContain(ACTIVE_ROOM);
      expect(ids).toContain(DRAFT_ROOM);
    });

    it("non-owner cannot see others' draft rooms", async () => {
      const rows = await withRLS(USER_C, (tx) => tx.select().from(rooms));
      const ids = rows.map((r) => r.id);
      expect(ids).toContain(ACTIVE_ROOM);
      expect(ids).not.toContain(DRAFT_ROOM);
    });

    it("owner can update own room", async () => {
      const [updated] = await withRLS(USER_A, (tx) =>
        tx.update(rooms).set({ description: "rls-update" }).where(eq(rooms.id, ACTIVE_ROOM)).returning(),
      );
      expect(updated.description).toBe("rls-update");
      await db.update(rooms).set({ description: null }).where(eq(rooms.id, ACTIVE_ROOM));
    });

    it("non-owner cannot update room", async () => {
      const result = await withRLS(USER_B, (tx) =>
        tx.update(rooms).set({ description: "hacked" }).where(eq(rooms.id, ACTIVE_ROOM)).returning(),
      );
      expect(result).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // House members — co-members visible, outsiders blocked, owner-only insert
  // -------------------------------------------------------------------------

  describe("houseMembers", () => {
    it("house member can see co-members in same house", async () => {
      const rows = await withRLS(USER_B, (tx) =>
        tx.select().from(houseMembers).where(eq(houseMembers.houseId, HOUSE_ID)),
      );
      expect(rows).toHaveLength(2);
    });

    it("outsider cannot see house members", async () => {
      const rows = await withRLS(USER_C, (tx) =>
        tx.select().from(houseMembers).where(eq(houseMembers.houseId, HOUSE_ID)),
      );
      expect(rows).toHaveLength(0);
    });

    it("non-owner cannot add house members", async () => {
      await expect(
        withRLS(USER_B, (tx) =>
          tx.insert(houseMembers).values({ houseId: HOUSE_ID, userId: USER_C }),
        ),
      ).rejects.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // Events — house members can view, only creator can modify
  // -------------------------------------------------------------------------

  describe("hospiEvents", () => {
    it("house member can see events in their room", async () => {
      const rows = await withRLS(USER_B, (tx) =>
        tx.select().from(hospiEvents).where(eq(hospiEvents.roomId, ACTIVE_ROOM)),
      );
      expect(rows).toHaveLength(1);
      expect(rows[0].id).toBe(EVENT_ID);
    });

    it("outsider cannot see events", async () => {
      const rows = await withRLS(USER_C, (tx) =>
        tx.select().from(hospiEvents).where(eq(hospiEvents.roomId, ACTIVE_ROOM)),
      );
      expect(rows).toHaveLength(0);
    });

    it("creator can update event", async () => {
      const [updated] = await withRLS(USER_A, (tx) =>
        tx.update(hospiEvents).set({ notes: "rls-note" }).where(eq(hospiEvents.id, EVENT_ID)).returning(),
      );
      expect(updated.notes).toBe("rls-note");
      await db.update(hospiEvents).set({ notes: null }).where(eq(hospiEvents.id, EVENT_ID));
    });

    it("non-creator house member cannot update event", async () => {
      const result = await withRLS(USER_B, (tx) =>
        tx.update(hospiEvents).set({ notes: "hacked" }).where(eq(hospiEvents.id, EVENT_ID)).returning(),
      );
      expect(result).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // Invitations — invitee OR event creator can view, outsider blocked
  // -------------------------------------------------------------------------

  describe("hospiInvitations", () => {
    it("invitee can see own invitation", async () => {
      const rows = await withRLS(USER_B, (tx) =>
        tx.select().from(hospiInvitations).where(eq(hospiInvitations.id, INVITATION_ID)),
      );
      expect(rows).toHaveLength(1);
    });

    it("event creator can see invitation", async () => {
      const rows = await withRLS(USER_A, (tx) =>
        tx.select().from(hospiInvitations).where(eq(hospiInvitations.id, INVITATION_ID)),
      );
      expect(rows).toHaveLength(1);
    });

    it("outsider cannot see invitation", async () => {
      const rows = await withRLS(USER_C, (tx) =>
        tx.select().from(hospiInvitations).where(eq(hospiInvitations.id, INVITATION_ID)),
      );
      expect(rows).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // Conversations — member-only access
  // -------------------------------------------------------------------------

  describe("conversations", () => {
    it("member can see conversation", async () => {
      const rows = await withRLS(USER_A, (tx) =>
        tx.select().from(conversations).where(eq(conversations.id, CONVERSATION_ID)),
      );
      expect(rows).toHaveLength(1);
    });

    it("non-member cannot see conversation", async () => {
      const rows = await withRLS(USER_C, (tx) =>
        tx.select().from(conversations).where(eq(conversations.id, CONVERSATION_ID)),
      );
      expect(rows).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // Messages — member can read, sender-only delete, non-member blocked
  // -------------------------------------------------------------------------

  describe("messages", () => {
    it("conversation member can see messages", async () => {
      const rows = await withRLS(USER_B, (tx) =>
        tx.select().from(messages).where(eq(messages.conversationId, CONVERSATION_ID)),
      );
      expect(rows).toHaveLength(1);
      expect(rows[0].id).toBe(MESSAGE_ID);
    });

    it("non-member cannot see messages", async () => {
      const rows = await withRLS(USER_C, (tx) =>
        tx.select().from(messages).where(eq(messages.conversationId, CONVERSATION_ID)),
      );
      expect(rows).toHaveLength(0);
    });

    it("sender can delete own message", async () => {
      // Insert a temporary message then delete it
      const [msg] = await withRLS(USER_A, (tx) =>
        tx.insert(messages).values({
          conversationId: CONVERSATION_ID, senderId: USER_A,
          ciphertext: "temp", iv: "temp-iv",
        }).returning(),
      );
      const deleted = await withRLS(USER_A, (tx) =>
        tx.delete(messages).where(eq(messages.id, msg.id)).returning(),
      );
      expect(deleted).toHaveLength(1);
    });

    it("non-sender cannot delete message", async () => {
      const result = await withRLS(USER_B, (tx) =>
        tx.delete(messages).where(eq(messages.id, MESSAGE_ID)).returning(),
      );
      expect(result).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // Votes — voter-only via crudPolicy
  // -------------------------------------------------------------------------

  describe("votes", () => {
    it("voter can see own votes", async () => {
      const rows = await withRLS(USER_A, (tx) =>
        tx.select().from(votes).where(eq(votes.id, VOTE_ID)),
      );
      expect(rows).toHaveLength(1);
    });

    it("outsider cannot see votes", async () => {
      const rows = await withRLS(USER_C, (tx) =>
        tx.select().from(votes).where(eq(votes.id, VOTE_ID)),
      );
      expect(rows).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // Message Receipts — user-only via crudPolicy
  // -------------------------------------------------------------------------

  describe("messageReceipts", () => {
    it("recipient can see own receipts", async () => {
      const rows = await withRLS(USER_A, (tx) =>
        tx.select().from(messageReceipts).where(eq(messageReceipts.messageId, MESSAGE_ID)),
      );
      expect(rows).toHaveLength(1);
    });

    it("other user cannot see receipts", async () => {
      const rows = await withRLS(USER_B, (tx) =>
        tx.select().from(messageReceipts).where(eq(messageReceipts.messageId, MESSAGE_ID)),
      );
      expect(rows).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // Public Keys — any authenticated can read, only own can insert/update
  // -------------------------------------------------------------------------

  describe("publicKeys", () => {
    it("any authenticated user can read all public keys", async () => {
      const rows = await withRLS(USER_C, (tx) => tx.select().from(publicKeys));
      const ids = rows.map((r) => r.userId);
      expect(ids).toContain(USER_A);
      expect(ids).toContain(USER_B);
    });

    it("user can insert own public key", async () => {
      const [row] = await withRLS(USER_C, (tx) =>
        tx.insert(publicKeys).values({
          userId: USER_C,
          publicKeyJwk: { kty: "EC", crv: "P-256", x: "test-x-c", y: "test-y-c" },
        }).returning(),
      );
      expect(row.userId).toBe(USER_C);
      // Cleanup
      await db.delete(publicKeys).where(eq(publicKeys.userId, USER_C));
    });

    it("user cannot insert a public key for another user", async () => {
      await expect(
        withRLS(USER_B, (tx) =>
          tx.insert(publicKeys).values({
            userId: USER_C,
            publicKeyJwk: { kty: "EC", crv: "P-256", x: "fake", y: "fake" },
          }),
        ),
      ).rejects.toThrow();
    });

    it("user cannot update another user's public key", async () => {
      const result = await withRLS(USER_B, (tx) =>
        tx.update(publicKeys)
          .set({ publicKeyJwk: { kty: "EC", crv: "P-256", x: "hacked", y: "hacked" } })
          .where(eq(publicKeys.userId, USER_A))
          .returning(),
      );
      expect(result).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // Private Key Backups — own only
  // -------------------------------------------------------------------------

  describe("privateKeyBackups", () => {
    it("user can read own backup", async () => {
      const rows = await withRLS(USER_A, (tx) =>
        tx.select().from(privateKeyBackups).where(eq(privateKeyBackups.userId, USER_A)),
      );
      expect(rows).toHaveLength(1);
      expect(rows[0].encryptedPrivateKey).toBe("enc-key-a");
    });

    it("user cannot read another user's backup", async () => {
      const rows = await withRLS(USER_B, (tx) =>
        tx.select().from(privateKeyBackups).where(eq(privateKeyBackups.userId, USER_A)),
      );
      expect(rows).toHaveLength(0);
    });

    it("user can insert own backup", async () => {
      const [row] = await withRLS(USER_B, (tx) =>
        tx.insert(privateKeyBackups).values({
          userId: USER_B, encryptedPrivateKey: "enc-key-b", backupIv: "iv-b", salt: "salt-b",
        }).returning(),
      );
      expect(row.userId).toBe(USER_B);
      // Cleanup
      await db.delete(privateKeyBackups).where(eq(privateKeyBackups.userId, USER_B));
    });

    it("user cannot insert backup for another user", async () => {
      await expect(
        withRLS(USER_B, (tx) =>
          tx.insert(privateKeyBackups).values({
            userId: USER_C, encryptedPrivateKey: "fake", backupIv: "fake", salt: "fake",
          }),
        ),
      ).rejects.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // Blocks — blocker-only access
  // -------------------------------------------------------------------------

  describe("blocks", () => {
    it("blocker can read own blocks", async () => {
      const rows = await withRLS(USER_A, (tx) =>
        tx.select().from(blocks).where(eq(blocks.blockerId, USER_A)),
      );
      expect(rows).toHaveLength(1);
      expect(rows[0].blockedId).toBe(USER_B);
    });

    it("blocked user cannot see blocks created by others", async () => {
      const rows = await withRLS(USER_B, (tx) => tx.select().from(blocks));
      expect(rows).toHaveLength(0);
    });

    it("user can insert a block (as blocker)", async () => {
      const [row] = await withRLS(USER_C, (tx) =>
        tx.insert(blocks).values({ blockerId: USER_C, blockedId: USER_A }).returning(),
      );
      expect(row.blockerId).toBe(USER_C);
      // Cleanup
      await db.delete(blocks).where(sql`${blocks.blockerId} = ${USER_C}`);
    });

    it("user cannot insert a block on behalf of another user", async () => {
      await expect(
        withRLS(USER_C, (tx) =>
          tx.insert(blocks).values({ blockerId: USER_A, blockedId: USER_C }),
        ),
      ).rejects.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // Reports — reporter + admin access
  // -------------------------------------------------------------------------

  describe("reports", () => {
    it("reporter can see own reports", async () => {
      const rows = await withRLS(USER_A, (tx) =>
        tx.select().from(reports).where(eq(reports.id, REPORT_ID)),
      );
      expect(rows).toHaveLength(1);
    });

    it("reporter cannot see other users' reports", async () => {
      const rows = await withRLS(USER_B, (tx) =>
        tx.select().from(reports).where(eq(reports.id, REPORT_ID)),
      );
      expect(rows).toHaveLength(0);
    });

    it("admin can see all reports", async () => {
      // Temporarily make USER_C admin
      await db.update(user).set({ role: "admin" }).where(eq(user.id, USER_C));
      try {
        const rows = await withRLS(USER_C, (tx) =>
          tx.select().from(reports).where(eq(reports.id, REPORT_ID)),
        );
        expect(rows).toHaveLength(1);
      } finally {
        await db.update(user).set({ role: "user" }).where(eq(user.id, USER_C));
      }
    });

    it("admin can update report status", async () => {
      await db.update(user).set({ role: "admin" }).where(eq(user.id, USER_C));
      try {
        const [updated] = await withRLS(USER_C, (tx) =>
          tx.update(reports).set({ status: "resolved" }).where(eq(reports.id, REPORT_ID)).returning(),
        );
        expect(updated.status).toBe("resolved");
        // Reset
        await db.update(reports).set({ status: "pending" }).where(eq(reports.id, REPORT_ID));
      } finally {
        await db.update(user).set({ role: "user" }).where(eq(user.id, USER_C));
      }
    });

    it("non-admin cannot update reports", async () => {
      const result = await withRLS(USER_B, (tx) =>
        tx.update(reports).set({ status: "resolved" }).where(eq(reports.id, REPORT_ID)).returning(),
      );
      expect(result).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // Chat integration: messages insert enforcement
  // -------------------------------------------------------------------------

  describe("chat integration", () => {
    it("non-member cannot insert messages into a conversation", async () => {
      await expect(
        withRLS(USER_C, (tx) =>
          tx.insert(messages).values({
            conversationId: CONVERSATION_ID,
            senderId: USER_C,
            ciphertext: "hacked",
            iv: "hacked-iv",
          }),
        ),
      ).rejects.toThrow();
    });

    it("conversation member can insert messages", async () => {
      const [msg] = await withRLS(USER_A, (tx) =>
        tx.insert(messages).values({
          conversationId: CONVERSATION_ID,
          senderId: USER_A,
          ciphertext: "valid-msg",
          iv: "valid-iv",
        }).returning(),
      );
      expect(msg.senderId).toBe(USER_A);
      // Cleanup
      await db.delete(messages).where(eq(messages.id, msg.id));
    });

    it("member cannot insert message as another user", async () => {
      await expect(
        withRLS(USER_A, (tx) =>
          tx.insert(messages).values({
            conversationId: CONVERSATION_ID,
            senderId: USER_B,
            ciphertext: "spoofed",
            iv: "spoofed-iv",
          }),
        ),
      ).rejects.toThrow();
    });

    it("receipt owner can read own receipts, others cannot", async () => {
      const rowsOwner = await withRLS(USER_A, (tx) =>
        tx.select().from(messageReceipts).where(eq(messageReceipts.messageId, MESSAGE_ID)),
      );
      expect(rowsOwner).toHaveLength(1);

      const rowsOther = await withRLS(USER_C, (tx) =>
        tx.select().from(messageReceipts).where(eq(messageReceipts.messageId, MESSAGE_ID)),
      );
      expect(rowsOther).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // Chat integration: unique constraints
  // -------------------------------------------------------------------------

  describe("chat constraints", () => {
    it("conversation unique constraint: duplicate (room_id, seeker_user_id) throws", async () => {
      // Seed a conversation with room + seeker
      await db.insert(conversations).values({
        id: CONVERSATION_ID2, roomId: ACTIVE_ROOM, seekerUserId: USER_C, type: "direct",
      });
      try {
        await expect(
          db.insert(conversations).values({
            roomId: ACTIVE_ROOM, seekerUserId: USER_C, type: "direct",
          }),
        ).rejects.toThrow();
      } finally {
        await db.delete(conversations).where(eq(conversations.id, CONVERSATION_ID2));
      }
    });

    it("application unique constraint: duplicate (room_id, user_id) throws", async () => {
      await db.insert(applications).values({
        roomId: ACTIVE_ROOM, userId: USER_C,
      });
      try {
        await expect(
          db.insert(applications).values({
            roomId: ACTIVE_ROOM, userId: USER_C,
          }),
        ).rejects.toThrow();
      } finally {
        await db.delete(applications).where(
          sql`${applications.roomId} = ${ACTIVE_ROOM} and ${applications.userId} = ${USER_C}`,
        );
      }
    });

    it("house member unique constraint: duplicate (house_id, user_id) throws", async () => {
      await expect(
        db.insert(houseMembers).values({ houseId: HOUSE_ID, userId: USER_A }),
      ).rejects.toThrow();
    });

    it("cascade delete: deleting a conversation cascades to members, messages, receipts", async () => {
      // Create a standalone conversation with members, messages, receipts
      const [conv] = await db.insert(conversations).values({ type: "direct" }).returning();
      await db.insert(conversationMembers).values([
        { conversationId: conv.id, userId: USER_A },
        { conversationId: conv.id, userId: USER_B },
      ]);
      const [msg] = await db.insert(messages).values({
        conversationId: conv.id, senderId: USER_A, ciphertext: "cascade-test", iv: "cascade-iv",
      }).returning();
      await db.insert(messageReceipts).values({
        messageId: msg.id, userId: USER_B, status: "delivered",
      });

      // Delete the conversation
      await db.delete(conversations).where(eq(conversations.id, conv.id));

      // Verify cascaded deletes
      const remainingMembers = await db.select().from(conversationMembers)
        .where(eq(conversationMembers.conversationId, conv.id));
      expect(remainingMembers).toHaveLength(0);

      const remainingMessages = await db.select().from(messages)
        .where(eq(messages.conversationId, conv.id));
      expect(remainingMessages).toHaveLength(0);

      const remainingReceipts = await db.select().from(messageReceipts)
        .where(eq(messageReceipts.messageId, msg.id));
      expect(remainingReceipts).toHaveLength(0);
    });
  });
});
