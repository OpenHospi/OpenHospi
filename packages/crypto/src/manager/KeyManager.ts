import { encryptIdentityBackup, decryptIdentityBackup } from "../protocol/backup";
import type { EncryptedBackup, IdentityBackupData } from "../protocol/backup";
import { toBase64 } from "../protocol/encoding";
import {
  generateIdentityKeyPair,
  generateRegistrationId,
  generateSignedPreKey,
  generateOneTimePreKeys,
} from "../protocol/keys";
import type { SignalProtocolStore } from "../stores/types";

const DEFAULT_PREKEY_COUNT = 100;
const REPLENISH_THRESHOLD = 25;

export interface KeyStatus {
  hasIdentity: boolean;
  registrationId: number | null;
  signedPreKeyId: number | null;
  availablePreKeys: number;
}

/**
 * Get the current key status from the store.
 */
export async function getKeyStatus(store: SignalProtocolStore): Promise<KeyStatus> {
  try {
    await store.getIdentityKeyPair(); // verify identity exists
    const registrationId = await store.getLocalRegistrationId();
    const preKeyCount = await store.getAvailablePreKeyCount();
    return {
      hasIdentity: true,
      registrationId,
      signedPreKeyId: null, // would need to track separately
      availablePreKeys: preKeyCount,
    };
  } catch {
    return {
      hasIdentity: false,
      registrationId: null,
      signedPreKeyId: null,
      availablePreKeys: 0,
    };
  }
}

/**
 * Generate all keys, store locally, and create a PIN-encrypted backup.
 *
 * Returns the public keys + backup to be uploaded to the server.
 */
export async function setupKeysWithPIN(
  store: SignalProtocolStore,
  pin: string,
): Promise<{
  registrationId: number;
  identityKeyPublic: string; // base64 X25519 DH public key
  signingKeyPublic: string; // base64 Ed25519 signing public key
  signedPreKey: { keyId: number; publicKey: string; signature: string };
  oneTimePreKeys: Array<{ keyId: number; publicKey: string }>;
  encryptedBackup: EncryptedBackup;
}> {
  const identity = generateIdentityKeyPair();
  const registrationId = generateRegistrationId();
  const signedPreKey = generateSignedPreKey(identity.signingKeyPair.privateKey, 1);
  const oneTimePreKeys = generateOneTimePreKeys(1, DEFAULT_PREKEY_COUNT);

  // Store locally
  // Note: the store implementation handles persisting the identity key pair
  // For IndexedDB, we use the storeIdentityData helper
  await store.storeSignedPreKey(signedPreKey.keyId, signedPreKey);
  for (const preKey of oneTimePreKeys) {
    await store.storePreKey(preKey.keyId, preKey);
  }

  // Create encrypted backup
  const backupData: IdentityBackupData = {
    signingPublicKey: toBase64(identity.signingKeyPair.publicKey),
    signingPrivateKey: toBase64(identity.signingKeyPair.privateKey),
    registrationId,
  };
  const encryptedBackup = await encryptIdentityBackup(backupData, pin);

  return {
    registrationId,
    identityKeyPublic: toBase64(identity.dhKeyPair.publicKey),
    signingKeyPublic: toBase64(identity.signingKeyPair.publicKey),
    signedPreKey: {
      keyId: signedPreKey.keyId,
      publicKey: toBase64(signedPreKey.keyPair.publicKey),
      signature: toBase64(signedPreKey.signature),
    },
    oneTimePreKeys: oneTimePreKeys.map((pk) => ({
      keyId: pk.keyId,
      publicKey: toBase64(pk.keyPair.publicKey),
    })),
    encryptedBackup,
  };
}

/**
 * Recover keys from an encrypted backup using the PIN.
 */
export async function recoverKeysWithPIN(
  backup: EncryptedBackup,
  pin: string,
): Promise<IdentityBackupData> {
  return decryptIdentityBackup(backup, pin);
}

/**
 * Generate and store new one-time prekeys if below threshold.
 * Returns the new public keys to upload to the server.
 */
export async function replenishOneTimePreKeys(
  store: SignalProtocolStore,
  currentMaxKeyId: number,
  count: number = DEFAULT_PREKEY_COUNT,
): Promise<Array<{ keyId: number; publicKey: string }> | null> {
  const available = await store.getAvailablePreKeyCount();
  if (available >= REPLENISH_THRESHOLD) return null;

  const newKeys = generateOneTimePreKeys(currentMaxKeyId + 1, count);
  for (const key of newKeys) {
    await store.storePreKey(key.keyId, key);
  }

  return newKeys.map((pk) => ({
    keyId: pk.keyId,
    publicKey: toBase64(pk.keyPair.publicKey),
  }));
}

/**
 * Rotate the signed prekey. Returns the new public key + signature to upload.
 */
export async function rotateSignedPreKey(
  store: SignalProtocolStore,
  newKeyId: number,
): Promise<{ keyId: number; publicKey: string; signature: string }> {
  const identity = await store.getIdentityKeyPair();
  const newSignedPreKey = generateSignedPreKey(identity.signingKeyPair.privateKey, newKeyId);
  await store.storeSignedPreKey(newSignedPreKey.keyId, newSignedPreKey);

  return {
    keyId: newSignedPreKey.keyId,
    publicKey: toBase64(newSignedPreKey.keyPair.publicKey),
    signature: toBase64(newSignedPreKey.signature),
  };
}
