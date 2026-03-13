"use server";

import { requireSession } from "@/lib/auth/server";
import {
  deactivateDevice,
  getDevicesForUser,
  getKeyBackup,
  getOneTimePreKeyCount,
  getPreKeyBundle,
  getPendingSenderKeyDistributions,
  insertOneTimePreKeys,
  insertSenderKeyDistribution,
  insertSignedPreKey,
  markDistributionDelivered,
  registerDevice,
  removeKeyBackup,
  upsertKeyBackup,
} from "@/lib/services/key-mutations";

// ── Devices ──

export async function registerUserDevice(data: {
  deviceId: number;
  registrationId: number;
  identityKeyPublic: string;
  platform: "web" | "ios" | "android";
  pushToken?: string;
}) {
  const session = await requireSession();
  return registerDevice(session.user.id, data);
}

export async function fetchDevicesForUser(targetUserId: string) {
  const session = await requireSession();
  return getDevicesForUser(session.user.id, targetUserId);
}

export async function deactivateUserDevice(deviceUuid: string) {
  const session = await requireSession();
  await deactivateDevice(session.user.id, deviceUuid);
}

// ── Pre-Keys ──

export async function uploadSignedPreKey(
  deviceUuid: string,
  data: { keyId: number; publicKey: string; signature: string },
) {
  await requireSession();
  await insertSignedPreKey(deviceUuid, data);
}

export async function uploadOneTimePreKeys(
  deviceUuid: string,
  keys: { keyId: number; publicKey: string }[],
) {
  await requireSession();
  await insertOneTimePreKeys(deviceUuid, keys);
}

export async function fetchPreKeyBundle(deviceUuid: string) {
  await requireSession();
  return getPreKeyBundle(deviceUuid);
}

export async function getPreKeyCount(deviceUuid: string): Promise<number> {
  await requireSession();
  return getOneTimePreKeyCount(deviceUuid);
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

// ── Sender Key Distributions ──

export async function storeSenderKeyDistribution(
  conversationId: string,
  senderDeviceId: string,
  recipientDeviceId: string,
  ciphertext: string,
) {
  const session = await requireSession();
  await insertSenderKeyDistribution(
    conversationId,
    session.user.id,
    senderDeviceId,
    recipientDeviceId,
    ciphertext,
  );
}

export async function fetchPendingDistributions(recipientDeviceId: string) {
  await requireSession();
  return getPendingSenderKeyDistributions(recipientDeviceId);
}

export async function acknowledgeDistribution(distributionId: string) {
  await requireSession();
  await markDistributionDelivered(distributionId);
}
