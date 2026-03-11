import { db, withRLS } from "@openhospi/database";
import {
  identityKeys,
  oneTimePreKeys,
  privateKeyBackups,
  signedPreKeys,
} from "@openhospi/database/schema";
import { eq, inArray, sql } from "drizzle-orm";

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
  return withRLS(userId, (tx) =>
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

// ── Private Key Backups (kept — repurposed for identity key backup) ──

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
  const [backup] = await withRLS(userId, (tx) =>
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
