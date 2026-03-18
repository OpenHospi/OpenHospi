import {
  ONE_TIME_PRE_KEY_BATCH_SIZE,
  ONE_TIME_PRE_KEY_REFILL_THRESHOLD,
  SIGNED_PRE_KEY_ROTATION_DAYS,
} from "@openhospi/shared/constants";

import { toBase64 } from "../protocol/encoding";
import { generatePreKeys, generateSignedPreKey } from "../protocol/keys";
import type { SignalProtocolStore } from "../stores/types";

export interface KeyMaintenanceActions {
  getPreKeyCount: (deviceId: string) => Promise<number>;
  uploadPreKeys: (
    deviceId: string,
    keys: Array<{ keyId: number; publicKey: string }>,
  ) => Promise<void>;
  uploadSignedPreKey: (
    deviceId: string,
    data: { keyId: number; publicKey: string; signature: string },
  ) => Promise<void>;
  getLatestSignedPreKeyTimestamp: (deviceId: string) => Promise<number | null>;
}

/**
 * Check and replenish one-time pre-keys if the server count is low.
 * Should be called periodically (e.g. on app foreground, after sending a message).
 */
export async function replenishPreKeysIfNeeded(
  store: SignalProtocolStore,
  deviceId: string,
  actions: KeyMaintenanceActions,
): Promise<boolean> {
  const serverCount = await actions.getPreKeyCount(deviceId);

  if (serverCount >= ONE_TIME_PRE_KEY_REFILL_THRESHOLD) {
    return false;
  }

  // Generate new batch starting after the highest ID ever used
  const maxId = await store.getMaxPreKeyId();
  const startId = maxId + 1;
  const newKeys = generatePreKeys(startId, ONE_TIME_PRE_KEY_BATCH_SIZE);

  // Store locally
  for (const pk of newKeys) {
    await store.storePreKey(pk.keyId, pk);
  }

  // Upload to server
  await actions.uploadPreKeys(
    deviceId,
    newKeys.map((pk) => ({
      keyId: pk.keyId,
      publicKey: toBase64(pk.keyPair.publicKey),
    })),
  );

  return true;
}

/**
 * Rotate the signed pre-key if it's older than SIGNED_PRE_KEY_ROTATION_DAYS.
 * Should be called periodically (e.g. on app foreground).
 */
export async function rotateSignedPreKeyIfNeeded(
  store: SignalProtocolStore,
  deviceId: string,
  actions: KeyMaintenanceActions,
): Promise<boolean> {
  const lastTimestamp = await actions.getLatestSignedPreKeyTimestamp(deviceId);
  const maxAgeMs = SIGNED_PRE_KEY_ROTATION_DAYS * 24 * 60 * 60 * 1000;

  if (lastTimestamp && Date.now() - lastTimestamp < maxAgeMs) {
    return false;
  }

  // Generate new signed pre-key with next ID
  const signingKeyPair = await store.getSigningKeyPair();
  const nextKeyId = lastTimestamp ? Math.floor(Date.now() / 1000) : 1;
  const newSpk = generateSignedPreKey(signingKeyPair.privateKey, nextKeyId);

  // Store locally
  await store.storeSignedPreKey(newSpk.keyId, newSpk);

  // Upload to server
  await actions.uploadSignedPreKey(deviceId, {
    keyId: newSpk.keyId,
    publicKey: toBase64(newSpk.keyPair.publicKey),
    signature: toBase64(newSpk.signature),
  });

  return true;
}
