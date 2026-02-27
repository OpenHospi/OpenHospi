"use client";

import {
  exportPrivateKey,
  exportPublicKey,
  generateKeyPair,
  importPrivateKey,
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
  fetchBackup: () => Promise<{ encryptedPrivateKey: string; backupIv: string; backupKey: string } | null>,
  uploadPublicKey: (jwk: JsonWebKey) => Promise<void>,
  uploadBackup: (data: { encryptedPrivateKey: string; backupIv: string; backupKey: string }) => Promise<void>,
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

/**
 * Creates an encrypted backup of the private key using a random AES key.
 * The backup key is stored alongside the encrypted data on the server.
 * This is NOT E2EE for the backup itself — the server can read it.
 * The purpose is key recovery when IndexedDB is cleared.
 */
async function createBackup(
  privateKeyJwk: JsonWebKey,
): Promise<{ encryptedPrivateKey: string; backupIv: string; backupKey: string }> {
  const backupKey = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(JSON.stringify(privateKeyJwk));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, backupKey, encoded);

  const rawKey = await crypto.subtle.exportKey("raw", backupKey);

  return {
    encryptedPrivateKey: arrayBufferToBase64(encrypted),
    backupIv: arrayBufferToBase64(iv),
    backupKey: arrayBufferToBase64(rawKey),
  };
}

async function decryptBackup(backup: {
  encryptedPrivateKey: string;
  backupIv: string;
  backupKey: string;
}): Promise<JsonWebKey> {
  const rawKey = base64ToArrayBuffer(backup.backupKey);
  const key = await crypto.subtle.importKey(
    "raw",
    rawKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  );

  const iv = base64ToArrayBuffer(backup.backupIv);
  const ciphertext = base64ToArrayBuffer(backup.encryptedPrivateKey);
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);

  return JSON.parse(new TextDecoder().decode(decrypted));
}

function arrayBufferToBase64(buf: ArrayBuffer | Uint8Array<ArrayBuffer>): string {
  const bytes = buf instanceof ArrayBuffer ? new Uint8Array(buf) : buf;
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function base64ToArrayBuffer(str: string): Uint8Array<ArrayBuffer> {
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
