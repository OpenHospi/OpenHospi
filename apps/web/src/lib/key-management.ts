"use client";

import {
  createBackup,
  decryptBackup,
  exportPrivateKey,
  exportPublicKey,
  generateKeyPair,
  importPrivateKey,
  type BackupData,
} from "@openhospi/crypto";

import { getStoredPrivateKey, storePrivateKey } from "./crypto-store";

/**
 * Ensures the user has a key pair available.
 *
 * Priority: IndexedDB → server backup → generate new pair.
 * Returns the private key (CryptoKey) for use in encryption/decryption.
 */
export async function ensureKeys(
  userId: string,
  fetchBackup: () => Promise<BackupData | null>,
  uploadPublicKey: (jwk: JsonWebKey) => Promise<void>,
  uploadBackup: (data: BackupData) => Promise<void>,
): Promise<CryptoKey> {
  // 1. Try IndexedDB
  const storedJwk = await getStoredPrivateKey(userId);
  if (storedJwk) {
    return importPrivateKey(storedJwk);
  }

  // 2. Try server backup
  const backup = await fetchBackup();
  if (backup) {
    const privateKeyJwk = await decryptBackup(backup);
    await storePrivateKey(userId, privateKeyJwk);
    return importPrivateKey(privateKeyJwk);
  }

  // 3. Generate new key pair
  const keyPair = await generateKeyPair();
  const publicKeyJwk = await exportPublicKey(keyPair.publicKey);
  const privateKeyJwk = await exportPrivateKey(keyPair.privateKey);

  // Store locally
  await storePrivateKey(userId, privateKeyJwk);

  // Upload public key to server
  await uploadPublicKey(publicKeyJwk);

  // Create encrypted backup on server
  const backupData = await createBackup(privateKeyJwk);
  await uploadBackup(backupData);

  return keyPair.privateKey;
}
