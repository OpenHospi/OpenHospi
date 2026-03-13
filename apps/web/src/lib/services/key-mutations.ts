import type { SenderKeyDistributionEnvelope } from "@openhospi/crypto";
import { and, eq, inArray, sql } from "drizzle-orm";

import { db, createDrizzleSupabaseClient } from "@/lib/db";
import {
  identityKeys,
  oneTimePreKeys,
  privateKeyBackups,
  senderKeyDistributions,
  signedPreKeys,
} from "@/lib/db/schema";

// ── Identity Keys ──

export async function upsertIdentityKey(
  userId: string,
  identityPublicKey: string,
  signingPublicKey: string,
) {
  await db
    .insert(identityKeys)
    .values({ userId, identityPublicKey, signingPublicKey })
    .onConflictDoUpdate({
      target: identityKeys.userId,
      set: { identityPublicKey, signingPublicKey, rotatedAt: new Date() },
    });
}

export async function getIdentityKeysByUserIds(
  userId: string,
  userIds: string[],
): Promise<{ userId: string; identityPublicKey: string; signingPublicKey: string }[]> {
  return createDrizzleSupabaseClient(userId).rls((tx) =>
    tx
      .select({
        userId: identityKeys.userId,
        identityPublicKey: identityKeys.identityPublicKey,
        signingPublicKey: identityKeys.signingPublicKey,
      })
      .from(identityKeys)
      .where(inArray(identityKeys.userId, userIds)),
  );
}

// ── Signed Pre-Keys ──

export async function insertSignedPreKey(
  userId: string,
  data: { keyId: number; publicKey: string; signature: string },
) {
  await db.insert(signedPreKeys).values({ userId, ...data });
}

// ── One-Time Pre-Keys ──

export async function insertOneTimePreKeys(
  userId: string,
  keys: { keyId: number; publicKey: string }[],
) {
  if (keys.length === 0) return;
  await db.insert(oneTimePreKeys).values(keys.map((k) => ({ userId, ...k })));
}

export async function getOneTimePreKeyCount(userId: string): Promise<number> {
  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(oneTimePreKeys)
    .where(eq(oneTimePreKeys.userId, userId));
  return result?.count ?? 0;
}

/**
 * Fetch a user's pre-key bundle for X3DH session establishment.
 * Atomically consumes one OPK (deletes it after fetching).
 * Runs with db directly (server-side operation, bypasses RLS).
 */
export async function getPreKeyBundle(targetUserId: string): Promise<{
  identityPublicKey: string;
  signingPublicKey: string;
  signedPreKeyId: number;
  signedPreKeyPublic: string;
  signedPreKeySignature: string;
  oneTimePreKeyId?: number;
  oneTimePreKeyPublic?: string;
} | null> {
  // Get identity key
  const [identity] = await db
    .select({
      identityPublicKey: identityKeys.identityPublicKey,
      signingPublicKey: identityKeys.signingPublicKey,
    })
    .from(identityKeys)
    .where(eq(identityKeys.userId, targetUserId));

  if (!identity) return null;

  // Get latest signed pre-key
  const [spk] = await db
    .select({
      keyId: signedPreKeys.keyId,
      publicKey: signedPreKeys.publicKey,
      signature: signedPreKeys.signature,
    })
    .from(signedPreKeys)
    .where(eq(signedPreKeys.userId, targetUserId))
    .orderBy(sql`${signedPreKeys.createdAt} desc`)
    .limit(1);

  if (!spk) return null;

  // Atomically consume one OPK (fetch + delete in transaction)
  let opk: { keyId: number; publicKey: string } | undefined;
  await db.transaction(async (tx) => {
    const [oldest] = await tx
      .select({
        id: oneTimePreKeys.id,
        keyId: oneTimePreKeys.keyId,
        publicKey: oneTimePreKeys.publicKey,
      })
      .from(oneTimePreKeys)
      .where(eq(oneTimePreKeys.userId, targetUserId))
      .orderBy(sql`${oneTimePreKeys.createdAt} asc`)
      .limit(1);

    if (oldest) {
      await tx.delete(oneTimePreKeys).where(eq(oneTimePreKeys.id, oldest.id));
      opk = { keyId: oldest.keyId, publicKey: oldest.publicKey };
    }
  });

  return {
    ...identity,
    signedPreKeyId: spk.keyId,
    signedPreKeyPublic: spk.publicKey,
    signedPreKeySignature: spk.signature,
    oneTimePreKeyId: opk?.keyId,
    oneTimePreKeyPublic: opk?.publicKey,
  };
}

// ── Private Key Backups ──

export async function upsertKeyBackup(
  userId: string,
  data: { encryptedPrivateKey: string; backupIv: string; salt: string },
) {
  const now = new Date();
  await db
    .insert(privateKeyBackups)
    .values({ userId, ...data, updatedAt: now })
    .onConflictDoUpdate({
      target: privateKeyBackups.userId,
      set: { ...data, updatedAt: now },
    });
}

export async function getKeyBackup(userId: string) {
  const [backup] = await createDrizzleSupabaseClient(userId).rls((tx) =>
    tx
      .select({
        encryptedPrivateKey: privateKeyBackups.encryptedPrivateKey,
        backupIv: privateKeyBackups.backupIv,
        salt: privateKeyBackups.salt,
        createdAt: privateKeyBackups.createdAt,
      })
      .from(privateKeyBackups)
      .where(eq(privateKeyBackups.userId, userId)),
  );
  return backup ?? null;
}

export async function removeKeyBackup(userId: string) {
  await db.delete(privateKeyBackups).where(eq(privateKeyBackups.userId, userId));
}

// ── Sender Key Distributions ──

export async function insertSenderKeyDistributions(
  distributorUserId: string,
  conversationId: string,
  distributions: Array<{
    recipientUserId: string;
    envelope: SenderKeyDistributionEnvelope;
  }>,
) {
  if (distributions.length === 0) return;

  for (const dist of distributions) {
    await db
      .insert(senderKeyDistributions)
      .values({
        conversationId,
        distributorUserId,
        recipientUserId: dist.recipientUserId,
        encryptedKeyData: dist.envelope.encryptedKeyData,
        iv: dist.envelope.iv,
        ephemeralPublicKey: dist.envelope.ephemeralPublicKey,
        senderIdentityKey: dist.envelope.senderIdentityKey,
        usedSignedPreKeyId: dist.envelope.usedSignedPreKeyId,
        usedOneTimePreKeyId: dist.envelope.usedOneTimePreKeyId ?? null,
      })
      .onConflictDoUpdate({
        target: [
          senderKeyDistributions.conversationId,
          senderKeyDistributions.distributorUserId,
          senderKeyDistributions.recipientUserId,
        ],
        set: {
          encryptedKeyData: dist.envelope.encryptedKeyData,
          iv: dist.envelope.iv,
          ephemeralPublicKey: dist.envelope.ephemeralPublicKey,
          senderIdentityKey: dist.envelope.senderIdentityKey,
          usedSignedPreKeyId: dist.envelope.usedSignedPreKeyId,
          usedOneTimePreKeyId: dist.envelope.usedOneTimePreKeyId ?? null,
        },
      });
  }
}

export async function getSenderKeyDistribution(
  conversationId: string,
  distributorUserId: string,
  recipientUserId: string,
): Promise<SenderKeyDistributionEnvelope | null> {
  const [row] = await db
    .select({
      encryptedKeyData: senderKeyDistributions.encryptedKeyData,
      iv: senderKeyDistributions.iv,
      ephemeralPublicKey: senderKeyDistributions.ephemeralPublicKey,
      senderIdentityKey: senderKeyDistributions.senderIdentityKey,
      usedSignedPreKeyId: senderKeyDistributions.usedSignedPreKeyId,
      usedOneTimePreKeyId: senderKeyDistributions.usedOneTimePreKeyId,
    })
    .from(senderKeyDistributions)
    .where(
      and(
        eq(senderKeyDistributions.conversationId, conversationId),
        eq(senderKeyDistributions.distributorUserId, distributorUserId),
        eq(senderKeyDistributions.recipientUserId, recipientUserId),
      ),
    );

  if (!row) return null;

  return {
    encryptedKeyData: row.encryptedKeyData,
    iv: row.iv,
    ephemeralPublicKey: row.ephemeralPublicKey,
    senderIdentityKey: row.senderIdentityKey,
    usedSignedPreKeyId: row.usedSignedPreKeyId,
    usedOneTimePreKeyId: row.usedOneTimePreKeyId ?? undefined,
  };
}

export async function getDistributionRecipients(
  conversationId: string,
  distributorUserId: string,
): Promise<string[]> {
  const rows = await db
    .select({ recipientUserId: senderKeyDistributions.recipientUserId })
    .from(senderKeyDistributions)
    .where(
      and(
        eq(senderKeyDistributions.conversationId, conversationId),
        eq(senderKeyDistributions.distributorUserId, distributorUserId),
      ),
    );
  return rows.map((r) => r.recipientUserId);
}
