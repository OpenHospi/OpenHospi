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
  insertSignedPreKey,
  insertSenderKeyDistribution,
  markDistributionDelivered,
  registerDevice as registerDeviceMutation,
  removeKeyBackup,
  upsertKeyBackup,
} from "@/lib/services/key-mutations";

// ── Device Registration (unified) ──

/**
 * Register a device with all its keys in one call.
 * This is the primary entry point for device setup — replaces the old
 * separate uploadIdentityKey / uploadSignedPreKey / uploadOneTimePreKeys flow.
 */
export async function registerUserDevice(data: {
  registrationId: number;
  identityKeyPublic: string;
  platform: "web" | "ios" | "android";
  signedPreKey: { keyId: number; publicKey: string; signature: string };
  oneTimePreKeys: { keyId: number; publicKey: string }[];
}) {
  const session = await requireSession();

  // Register device (server assigns deviceId=1 for now)
  const device = await registerDeviceMutation(session.user.id, {
    deviceId: 1,
    registrationId: data.registrationId,
    identityKeyPublic: data.identityKeyPublic,
    platform: data.platform,
  });

  // Store signed prekey + one-time prekeys for the device
  await insertSignedPreKey(device.id, data.signedPreKey);
  await insertOneTimePreKeys(device.id, data.oneTimePreKeys);

  return { id: device.id, deviceId: device.deviceId };
}

// ── Device Queries ──

export async function fetchDevicesForUser(targetUserId: string) {
  const session = await requireSession();
  return getDevicesForUser(session.user.id, targetUserId);
}

export async function deactivateUserDevice(deviceUuid: string) {
  const session = await requireSession();
  await deactivateDevice(session.user.id, deviceUuid);
}

// ── Pre-Key Management (for rotation/replenishment after initial registration) ──

export async function replenishOneTimePreKeys(
  deviceUuid: string,
  keys: { keyId: number; publicKey: string }[],
) {
  await requireSession();
  await insertOneTimePreKeys(deviceUuid, keys);
}

export async function rotateSignedPreKey(
  deviceUuid: string,
  data: { keyId: number; publicKey: string; signature: string },
) {
  await requireSession();
  await insertSignedPreKey(deviceUuid, data);
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
