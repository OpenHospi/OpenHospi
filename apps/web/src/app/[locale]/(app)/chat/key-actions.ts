"use server";

import { requireSession } from "@/lib/auth/server";
import {
  getIdentityKeysByUserIds,
  getKeyBackup,
  getOneTimePreKeyCount,
  getPreKeyBundle,
  insertOneTimePreKeys,
  insertSignedPreKey,
  removeKeyBackup,
  upsertIdentityKey,
  upsertKeyBackup,
} from "@/lib/services/key-mutations";

// ── Identity Keys ──

export async function uploadIdentityKey(identityPublicKey: string, signingPublicKey: string) {
  const session = await requireSession();
  await upsertIdentityKey(session.user.id, identityPublicKey, signingPublicKey);
}

export async function fetchIdentityKeys(
  userIds: string[],
): Promise<{ userId: string; identityPublicKey: string; signingPublicKey: string }[]> {
  const session = await requireSession();
  return getIdentityKeysByUserIds(session.user.id, userIds);
}

// ── Pre-Keys ──

export async function uploadSignedPreKey(data: {
  keyId: number;
  publicKey: string;
  signature: string;
}) {
  const session = await requireSession();
  await insertSignedPreKey(session.user.id, data);
}

export async function uploadOneTimePreKeys(keys: { keyId: number; publicKey: string }[]) {
  const session = await requireSession();
  await insertOneTimePreKeys(session.user.id, keys);
}

export async function fetchPreKeyBundle(userId: string) {
  await requireSession();
  return getPreKeyBundle(userId);
}

export async function getPreKeyCount(): Promise<number> {
  const session = await requireSession();
  return getOneTimePreKeyCount(session.user.id);
}

// ── Backup ──

export async function uploadKeyBackup(data: {
  encryptedPrivateKey: string;
  backupIv: string;
  salt: string;
}) {
  const session = await requireSession();
  await upsertKeyBackup(session.user.id, data);
}

export async function fetchKeyBackup(): Promise<{
  encryptedPrivateKey: string;
  backupIv: string;
  salt: string;
  createdAt: Date;
} | null> {
  const session = await requireSession();
  return getKeyBackup(session.user.id);
}

export async function deleteKeyBackup() {
  const session = await requireSession();
  await removeKeyBackup(session.user.id);
}
