import { getCryptoProvider } from "../primitives/CryptoProvider";
import { toBase64 } from "../protocol/encoding";
import {
  generateIdentityKeyPair,
  generatePreKeys,
  generateRegistrationId,
  generateSignedPreKey,
} from "../protocol/keys";
import type { EncryptedBackup, PreKeyRecord, SignedPreKeyRecord } from "../protocol/types";
import type { SignalProtocolStore } from "../stores/types";

export interface DeviceSetupResult {
  registrationId: number;
  identityKeyPublic: string;
  signingKeyPublic: string;
  signedPreKey: {
    keyId: number;
    publicKey: string;
    signature: string;
  };
  oneTimePreKeys: Array<{
    keyId: number;
    publicKey: string;
  }>;
  encryptedBackup: EncryptedBackup;
}

/**
 * Generate all keys for a new device and persist them to the store.
 * Returns the public components for server upload.
 */
export async function setupDevice(
  store: SignalProtocolStore,
  pin: string,
  preKeyCount = 100,
): Promise<DeviceSetupResult> {
  const provider = getCryptoProvider();

  // Generate identity keys
  const { dhKeyPair, signingKeyPair } = generateIdentityKeyPair();
  const registrationId = generateRegistrationId();

  // Generate signed pre-key
  const signedPreKey = generateSignedPreKey(signingKeyPair.privateKey, 1);

  // Generate one-time pre-keys
  const oneTimePreKeys = generatePreKeys(1, preKeyCount);

  // Encrypt private key backup with PIN
  const backup = await encryptBackupWithPIN(pin, dhKeyPair.privateKey, signingKeyPair.privateKey);

  // Store everything locally
  // Identity keys are stored by the store implementation
  // Pre-keys
  await store.storeSignedPreKey(signedPreKey.keyId, signedPreKey);
  for (const pk of oneTimePreKeys) {
    await store.storePreKey(pk.keyId, pk);
  }

  return {
    registrationId,
    identityKeyPublic: toBase64(dhKeyPair.publicKey),
    signingKeyPublic: toBase64(signingKeyPair.publicKey),
    signedPreKey: {
      keyId: signedPreKey.keyId,
      publicKey: toBase64(signedPreKey.keyPair.publicKey),
      signature: toBase64(signedPreKey.signature),
    },
    oneTimePreKeys: oneTimePreKeys.map((pk) => ({
      keyId: pk.keyId,
      publicKey: toBase64(pk.keyPair.publicKey),
    })),
    encryptedBackup: backup,
  };
}

async function encryptBackupWithPIN(
  pin: string,
  dhPrivateKey: Uint8Array,
  signingPrivateKey: Uint8Array,
): Promise<EncryptedBackup> {
  const provider = getCryptoProvider();

  const salt = provider.randomBytes(16);
  const iv = provider.randomBytes(16);

  // Derive encryption key from PIN using HKDF (with salt)
  const pinBytes = new TextEncoder().encode(pin);
  const derivedKey = provider.hkdf(pinBytes, salt, new TextEncoder().encode("OpenHospiBackup"), 32);

  // Combine both private keys for backup
  const combined = new Uint8Array(64);
  combined.set(dhPrivateKey, 0);
  combined.set(signingPrivateKey, 32);

  const ciphertext = provider.aesCbcEncrypt(derivedKey, iv, combined);

  return {
    version: 1,
    ciphertext: toBase64(ciphertext),
    iv: toBase64(iv),
    salt: toBase64(salt),
  };
}

/**
 * Recover keys from an encrypted backup using a PIN.
 */
export async function recoverFromBackup(
  backup: EncryptedBackup,
  pin: string,
): Promise<{
  dhPrivateKey: Uint8Array;
  signingPrivateKey: Uint8Array;
}> {
  const provider = getCryptoProvider();
  const { fromBase64 } = await import("../protocol/encoding");

  const salt = fromBase64(backup.salt);
  const iv = fromBase64(backup.iv);
  const ciphertext = fromBase64(backup.ciphertext);

  const pinBytes = new TextEncoder().encode(pin);
  const derivedKey = provider.hkdf(pinBytes, salt, new TextEncoder().encode("OpenHospiBackup"), 32);

  const decrypted = provider.aesCbcDecrypt(derivedKey, iv, ciphertext);

  return {
    dhPrivateKey: decrypted.slice(0, 32),
    signingPrivateKey: decrypted.slice(32, 64),
  };
}
