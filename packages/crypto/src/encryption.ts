/**
 * AES-256-GCM encryption/decryption wrappers.
 *
 * The auth tag is appended to the ciphertext (Web Crypto default).
 * AAD (additional authenticated data) includes the message header for authentication.
 */
import type { CryptoBackend } from "./platform";

const IV_LENGTH = 12;

/**
 * Encrypt plaintext with AES-256-GCM.
 * Returns base64-encoded ciphertext and IV.
 */
export async function encrypt(
  backend: CryptoBackend,
  key: Uint8Array,
  plaintext: Uint8Array,
  aad?: Uint8Array,
): Promise<{ ciphertext: Uint8Array; iv: Uint8Array }> {
  const iv = backend.randomBytes(IV_LENGTH);
  const ciphertext = await backend.aesGcmEncrypt(key, plaintext, iv, aad);
  return { ciphertext, iv };
}

/**
 * Decrypt AES-256-GCM ciphertext.
 * Throws on authentication failure (tampered data, wrong key, etc.).
 */
export async function decrypt(
  backend: CryptoBackend,
  key: Uint8Array,
  ciphertext: Uint8Array,
  iv: Uint8Array,
  aad?: Uint8Array,
): Promise<Uint8Array> {
  return backend.aesGcmDecrypt(key, ciphertext, iv, aad);
}

/**
 * Encode a message header as AAD bytes for AES-GCM authentication.
 * This binds the header to the ciphertext — any modification is detected.
 */
export function encodeHeaderAsAad(
  ratchetPublicKey: string,
  messageNumber: number,
  previousChainLength: number,
): Uint8Array {
  const headerStr = `${ratchetPublicKey}|${messageNumber}|${previousChainLength}`;
  return new TextEncoder().encode(headerStr);
}
