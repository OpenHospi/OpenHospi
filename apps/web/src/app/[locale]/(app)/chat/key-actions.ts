"use server";

import { requireSession } from "@/lib/auth/server";
import {
  getKeyBackup,
  getPublicKeysByUserIds,
  removeKeyBackup,
  upsertKeyBackup,
  upsertPublicKey,
} from "@/lib/services/key-mutations";

export async function uploadPublicKey(publicKeyJwk: JsonWebKey) {
  const session = await requireSession();
  await upsertPublicKey(session.user.id, publicKeyJwk);
}

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

export async function fetchPublicKeys(
  userIds: string[],
): Promise<{ userId: string; publicKeyJwk: JsonWebKey }[]> {
  const session = await requireSession();
  return getPublicKeysByUserIds(session.user.id, userIds);
}
