import { getCryptoProvider } from "../primitives/CryptoProvider";

import { toBase64, fromBase64 } from "./encoding";

const PBKDF2_ITERATIONS = 600_000;
const SALT_LENGTH = 32;

export interface IdentityBackupData {
  signingPublicKey: string; // base64
  signingPrivateKey: string; // base64
  registrationId: number;
}

export interface EncryptedBackup {
  version: number;
  salt: string; // base64
  iv: string; // base64
  ciphertext: string; // base64 (AES-256-GCM encrypted IdentityBackupData)
}

/**
 * Derive a 256-bit encryption key from a PIN using PBKDF2.
 */
export async function deriveKeyFromPIN(pin: string, salt: Uint8Array): Promise<Uint8Array> {
  const crypto = getCryptoProvider();
  return crypto.pbkdf2(new TextEncoder().encode(pin), salt, PBKDF2_ITERATIONS, 32);
}

/**
 * Encrypt identity key material with a PIN-derived key.
 */
export async function encryptIdentityBackup(
  data: IdentityBackupData,
  pin: string,
): Promise<EncryptedBackup> {
  const crypto = getCryptoProvider();
  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = await deriveKeyFromPIN(pin, salt);
  const iv = crypto.randomBytes(12); // 96-bit IV for GCM

  const plaintext = new TextEncoder().encode(JSON.stringify(data));
  const ciphertext = await crypto.aesGcmEncrypt(key, plaintext, iv);

  return {
    version: 1,
    salt: toBase64(salt),
    iv: toBase64(iv),
    ciphertext: toBase64(ciphertext),
  };
}

/**
 * Decrypt identity key material from a backup using the PIN.
 */
export async function decryptIdentityBackup(
  backup: EncryptedBackup,
  pin: string,
): Promise<IdentityBackupData> {
  const salt = fromBase64(backup.salt);
  const iv = fromBase64(backup.iv);
  const ciphertext = fromBase64(backup.ciphertext);

  const key = await deriveKeyFromPIN(pin, salt);
  const plaintext = await getCryptoProvider().aesGcmDecrypt(key, ciphertext, iv);

  return JSON.parse(new TextDecoder().decode(plaintext)) as IdentityBackupData;
}
