/**
 * Identity key backup: encrypt/decrypt identity key material with a PIN-derived key.
 *
 * Uses PBKDF2-SHA256 (600k iterations) + AES-256-GCM.
 * Compatible with the existing privateKeyBackups table.
 */
import { PBKDF2_ITERATIONS } from "@openhospi/shared/constants";

import { toBase64, fromBase64 } from "./encoding";
import type { CryptoBackend } from "./platform";

export type IdentityBackupData = {
  signingPrivateKey: string; // base64
  signingPublicKey: string; // base64
  dhPrivateKey: string; // base64
  dhPublicKey: string; // base64
};

export type EncryptedBackup = {
  ciphertext: string; // base64
  iv: string; // base64
  salt: string; // base64
};

/** Derive a 256-bit wrapping key from a PIN using PBKDF2-SHA256 */
export async function deriveKeyFromPIN(
  backend: CryptoBackend,
  pin: string,
  salt: Uint8Array,
  iterations = PBKDF2_ITERATIONS,
): Promise<Uint8Array> {
  const password = new TextEncoder().encode(pin);
  return backend.pbkdf2(password, salt, iterations, 32);
}

/** Encrypt identity key material for server-side backup */
export async function encryptIdentityBackup(
  backend: CryptoBackend,
  data: IdentityBackupData,
  pin: string,
): Promise<EncryptedBackup> {
  const salt = backend.randomBytes(32);
  const wrappingKey = await deriveKeyFromPIN(backend, pin, salt);
  const plaintext = new TextEncoder().encode(JSON.stringify(data));
  const iv = backend.randomBytes(12);
  const ciphertext = await backend.aesGcmEncrypt(wrappingKey, plaintext, iv);

  return {
    ciphertext: toBase64(ciphertext),
    iv: toBase64(iv),
    salt: toBase64(salt),
  };
}

/** Decrypt identity key material from server-side backup */
export async function decryptIdentityBackup(
  backend: CryptoBackend,
  backup: EncryptedBackup,
  pin: string,
): Promise<IdentityBackupData> {
  const salt = fromBase64(backup.salt);
  const wrappingKey = await deriveKeyFromPIN(backend, pin, salt);
  const ciphertext = fromBase64(backup.ciphertext);
  const iv = fromBase64(backup.iv);
  const plaintext = await backend.aesGcmDecrypt(wrappingKey, ciphertext, iv);

  return JSON.parse(new TextDecoder().decode(plaintext));
}
