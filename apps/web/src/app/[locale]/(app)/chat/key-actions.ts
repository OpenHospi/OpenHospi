"use server";

import { requireSession } from "@/lib/auth/server";
import {
  fetchPreKeyBundle,
  getDevicesForUser,
  getKeyBackup,
  registerDevice,
  removeKeyBackup,
  replenishOneTimePreKeys,
  rotateSignedPreKey,
  upsertKeyBackup,
  storeSenderKeyDistribution,
  fetchPendingDistributions,
  acknowledgeDistribution,
} from "@/lib/services/key-mutations";

export async function registerUserDevice(data: {
  registrationId: number;
  identityKeyPublic: string;
  signingKeyPublic: string;
  platform: "web" | "ios" | "android";
  signedPreKey: { keyId: number; publicKey: string; signature: string };
  oneTimePreKeys: Array<{ keyId: number; publicKey: string }>;
}) {
  const session = await requireSession();
  return registerDevice({ userId: session.user.id, ...data });
}

export async function fetchDevicesForUser(targetUserId: string) {
  await requireSession();
  return getDevicesForUser(targetUserId);
}

export async function fetchPreKeyBundleForDevice(targetDeviceUuid: string) {
  await requireSession();
  return fetchPreKeyBundle(targetDeviceUuid);
}

export async function replenishPreKeys(
  deviceUuid: string,
  keys: Array<{ keyId: number; publicKey: string }>,
) {
  await requireSession();
  return replenishOneTimePreKeys(deviceUuid, keys);
}

export async function rotateDeviceSignedPreKey(
  deviceUuid: string,
  data: { keyId: number; publicKey: string; signature: string },
) {
  await requireSession();
  return rotateSignedPreKey(deviceUuid, data);
}

export async function uploadKeyBackup(data: { encryptedData: string; iv: string; salt: string }) {
  const session = await requireSession();
  return upsertKeyBackup({ userId: session.user.id, ...data });
}

export async function fetchKeyBackup() {
  const session = await requireSession();
  return getKeyBackup(session.user.id);
}

export async function deleteKeyBackup() {
  const session = await requireSession();
  return removeKeyBackup(session.user.id);
}

export async function storeSenderKeyDist(data: {
  conversationId: string;
  senderDeviceId: string;
  recipientDeviceId: string;
  ciphertext: string;
}) {
  const session = await requireSession();
  return storeSenderKeyDistribution({
    ...data,
    senderUserId: session.user.id,
  });
}

export async function fetchPendingDists(recipientDeviceId: string) {
  await requireSession();
  return fetchPendingDistributions(recipientDeviceId);
}

export async function acknowledgeDist(id: string) {
  await requireSession();
  return acknowledgeDistribution(id);
}
