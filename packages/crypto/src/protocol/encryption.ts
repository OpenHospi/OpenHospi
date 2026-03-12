/**
 * AES-256-GCM encryption/decryption wrappers.
 *
 * The auth tag is appended to the ciphertext (Web Crypto default).
 * AAD (additional authenticated data) binds ciphertext to context.
 */
import type { CryptoBackend } from "../backends/platform";

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
 * Encode AAD for group messages — binds ciphertext to conversation + sender + iteration + chainId.
 */
export function encodeGroupAad(
  conversationId: string,
  senderUserId: string,
  chainIteration: number,
  chainId: string,
): Uint8Array {
  return new TextEncoder().encode(`${conversationId}|${senderUserId}|${chainIteration}|${chainId}`);
}

/**
 * Encode data for Ed25519 signing — binds signature to ciphertext + iv + iteration + chainId.
 */
export function encodeSignatureData(
  ciphertext: string,
  iv: string,
  chainIteration: number,
  chainId: string,
): Uint8Array {
  return new TextEncoder().encode(`${ciphertext}|${iv}|${chainIteration}|${chainId}`);
}
