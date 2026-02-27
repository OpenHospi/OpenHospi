"use server";

import { db, withRLS } from "@openhospi/database";
import { privateKeyBackups, publicKeys } from "@openhospi/database/schema";
import { eq, inArray } from "drizzle-orm";

import { requireSession } from "@/lib/auth-server";

export async function uploadPublicKey(publicKeyJwk: JsonWebKey) {
  const session = await requireSession();

  await db
    .insert(publicKeys)
    .values({ userId: session.user.id, publicKeyJwk })
    .onConflictDoUpdate({
      target: publicKeys.userId,
      set: { publicKeyJwk, rotatedAt: new Date() },
    });
}

export async function uploadKeyBackup(data: {
  encryptedPrivateKey: string;
  backupIv: string;
  backupKey: string;
}) {
  const session = await requireSession();

  await db
    .insert(privateKeyBackups)
    .values({ userId: session.user.id, ...data })
    .onConflictDoUpdate({
      target: privateKeyBackups.userId,
      set: data,
    });
}

export async function fetchKeyBackup(): Promise<{
  encryptedPrivateKey: string;
  backupIv: string;
  backupKey: string;
} | null> {
  const session = await requireSession();

  const [backup] = await withRLS(session.user.id, (tx) =>
    tx
      .select({
        encryptedPrivateKey: privateKeyBackups.encryptedPrivateKey,
        backupIv: privateKeyBackups.backupIv,
        backupKey: privateKeyBackups.backupKey,
      })
      .from(privateKeyBackups)
      .where(eq(privateKeyBackups.userId, session.user.id)),
  );

  return backup ?? null;
}

export async function fetchPublicKeys(
  userIds: string[],
): Promise<{ userId: string; publicKeyJwk: JsonWebKey }[]> {
  const session = await requireSession();

  const rows = await withRLS(session.user.id, (tx) =>
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
