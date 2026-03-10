import { db, withRLS } from "@openhospi/database";
import { privateKeyBackups, publicKeys } from "@openhospi/database/schema";
import { eq, inArray } from "drizzle-orm";

export async function upsertPublicKey(userId: string, publicKeyJwk: JsonWebKey) {
  await db
    .insert(publicKeys)
    .values({ userId, publicKeyJwk })
    .onConflictDoUpdate({
      target: publicKeys.userId,
      set: { publicKeyJwk, rotatedAt: new Date() },
    });
}

export async function upsertKeyBackup(
  userId: string,
  data: {
    encryptedPrivateKey: string;
    backupIv: string;
    salt: string;
  },
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

export async function getPublicKeysByUserIds(
  userId: string,
  userIds: string[],
): Promise<{ userId: string; publicKeyJwk: JsonWebKey }[]> {
  const rows = await withRLS(userId, (tx) =>
    tx
      .select({
        userId: publicKeys.userId,
        publicKeyJwk: publicKeys.publicKeyJwk,
      })
      .from(publicKeys)
      .where(inArray(publicKeys.userId, userIds)),
  );

  return rows.map((r) => ({
    userId: r.userId,
    publicKeyJwk: r.publicKeyJwk as JsonWebKey,
  }));
}
