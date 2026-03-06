"use client";

import {
  deriveKeyFromPIN,
  encryptPrivateKeyBackup,
  decryptPrivateKeyBackup,
  exportPrivateKey,
  exportPublicKey,
  generateKeyPair,
  importPrivateKey,
  toBase64,
  fromBase64,
} from "@openhospi/crypto";
import { PBKDF2_ITERATIONS } from "@openhospi/shared/constants";

import { deleteStoredPrivateKey, getStoredPrivateKey, storePrivateKey } from "./store";

export type KeyStatus = "ready" | "needs-recovery" | "needs-setup";

export async function getKeyStatus(
  userId: string,
  fetchBackup: () => Promise<{ salt: string } | null>,
): Promise<KeyStatus> {
  const storedJwk = await getStoredPrivateKey(userId);
  if (storedJwk) return "ready";

  const backup = await fetchBackup();
  if (backup) return "needs-recovery";

  return "needs-setup";
}

export async function setupKeysWithPIN(
  userId: string,
  pin: string,
  uploadPublicKey: (jwk: JsonWebKey) => Promise<void>,
  uploadBackup: (data: {
    encryptedPrivateKey: string;
    backupIv: string;
    salt: string;
  }) => Promise<void>,
): Promise<void> {
  // Generate new key pair
  const keyPair = await generateKeyPair();
  const publicKeyJwk = await exportPublicKey(keyPair.publicKey);
  const privateKeyJwk = await exportPrivateKey(keyPair.privateKey);

  // Derive wrapping key from PIN
  const salt = crypto.getRandomValues(new Uint8Array(32));
  const wrappingKey = await deriveKeyFromPIN(pin, salt, PBKDF2_ITERATIONS);

  // Encrypt private key
  const backup = await encryptPrivateKeyBackup(privateKeyJwk, wrappingKey);

  // Upload to server
  await uploadPublicKey(publicKeyJwk);
  await uploadBackup({
    encryptedPrivateKey: backup.ciphertext,
    backupIv: backup.iv,
    salt: toBase64(salt),
  });

  // Store locally
  await storePrivateKey(userId, privateKeyJwk);
}

export async function recoverKeysWithPIN(
  userId: string,
  pin: string,
  backup: { encryptedPrivateKey: string; backupIv: string; salt: string },
): Promise<void> {
  const salt = fromBase64(backup.salt);
  const wrappingKey = await deriveKeyFromPIN(pin, salt, PBKDF2_ITERATIONS);

  const privateKeyJwk = await decryptPrivateKeyBackup(
    backup.encryptedPrivateKey,
    backup.backupIv,
    wrappingKey,
  );

  // Store locally
  await storePrivateKey(userId, privateKeyJwk);
}

export async function resetKeys(
  userId: string,
  uploadPublicKey: (jwk: JsonWebKey) => Promise<void>,
  deleteBackup: () => Promise<void>,
): Promise<void> {
  // Delete old local key
  await deleteStoredPrivateKey(userId);

  // Delete old backup from server
  await deleteBackup();

  // Generate fresh key pair
  const keyPair = await generateKeyPair();
  const publicKeyJwk = await exportPublicKey(keyPair.publicKey);
  const privateKeyJwk = await exportPrivateKey(keyPair.privateKey);

  // Upload new public key (replaces old one via upsert)
  await uploadPublicKey(publicKeyJwk);

  // Store new private key locally (backup will be set up separately)
  await storePrivateKey(userId, privateKeyJwk);
}

export async function importAndStoreKey(userId: string): Promise<CryptoKey | null> {
  const storedJwk = await getStoredPrivateKey(userId);
  if (!storedJwk) return null;
  return importPrivateKey(storedJwk);
}
