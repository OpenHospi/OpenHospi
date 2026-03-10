/**
 * Safety Number generation for key verification (MITM detection).
 *
 * Based on Signal's safety number algorithm:
 * 1. Take both users' Ed25519 signing public keys
 * 2. Sort by user ID (deterministic — both users see the same code)
 * 3. For each: SHA-512(key || userId) iterated 5200 times
 * 4. Concatenate both 32-byte digests
 * 5. Convert to 12 groups of 5 digits (60-digit code)
 */

import { toBase64 } from "./encoding";
const SAFETY_NUMBER_ITERATIONS = 5200;

/**
 * Generate a safety number for verifying identity between two users.
 * The result is deterministic — both users will generate the same number.
 *
 * @returns 60-digit string formatted as 12 groups of 5 digits
 */
export async function generateSafetyNumber(
  ourUserId: string,
  ourSigningPublicKey: Uint8Array,
  theirUserId: string,
  theirSigningPublicKey: Uint8Array,
): Promise<string> {
  // Sort by userId to ensure both sides generate the same number
  const [firstId, firstKey, secondId, secondKey] =
    ourUserId < theirUserId
      ? [ourUserId, ourSigningPublicKey, theirUserId, theirSigningPublicKey]
      : [theirUserId, theirSigningPublicKey, ourUserId, ourSigningPublicKey];

  const firstDigest = await iteratedHash(firstKey, firstId);
  const secondDigest = await iteratedHash(secondKey, secondId);

  // Concatenate both 32-byte digests → 64 bytes
  const combined = new Uint8Array(64);
  combined.set(firstDigest.slice(0, 32));
  combined.set(secondDigest.slice(0, 32), 32);

  // Convert to 12 groups of 5 digits
  return digestToCode(combined);
}

/**
 * Iteratively hash: SHA-512(key || userId) repeated SAFETY_NUMBER_ITERATIONS times.
 * Each iteration feeds the previous output back as input (with key prepended).
 */
async function iteratedHash(publicKey: Uint8Array, userId: string): Promise<Uint8Array> {
  const userIdBytes = new TextEncoder().encode(userId);
  let hash = concat(publicKey, userIdBytes);

  for (let i = 0; i < SAFETY_NUMBER_ITERATIONS; i++) {
    const input = concat(hash, publicKey);
    const digest = await crypto.subtle.digest("SHA-512", new Uint8Array(input));
    hash = new Uint8Array(digest);
  }

  return hash;
}

/** Convert 64 bytes into 12 groups of 5 digits */
function digestToCode(digest: Uint8Array): string {
  const groups: string[] = [];

  for (let i = 0; i < 12; i++) {
    // Take 5 bytes (40 bits), interpret as a big number, mod 100000
    const offset = i * 5;
    const value =
      (digest[offset] * 2 ** 32 +
        digest[offset + 1] * 2 ** 24 +
        digest[offset + 2] * 2 ** 16 +
        digest[offset + 3] * 2 ** 8 +
        digest[offset + 4]) %
      100_000;
    groups.push(value.toString().padStart(5, "0"));
  }

  return groups.join(" ");
}

function concat(a: Uint8Array, b: Uint8Array): Uint8Array {
  const result = new Uint8Array(a.length + b.length);
  result.set(a);
  result.set(b, a.length);
  return result;
}

// ── QR Payload ──

type SafetyNumberQRPayload = {
  v: 1;
  uid: string;
  spk: string;
  sn: string;
};

export type QRVerifySuccess = {
  valid: true;
  peerUserId: string;
  peerSigningKey: string;
};
export type QRVerifyFailure = {
  valid: false;
  reason: "invalid_format" | "version_unsupported" | "mismatch";
};
export type QRVerifyResult = QRVerifySuccess | QRVerifyFailure;

/**
 * Encode identity + safety number into a QR payload string.
 * The displayer shows this as a QR code; the scanner reads and verifies it.
 *
 * Format: base64(JSON({ v, uid, spk, sn }))
 */
export function encodeSafetyNumberQR(
  userId: string,
  signingPublicKey: Uint8Array,
  safetyNumber: string,
): string {
  const payload: SafetyNumberQRPayload = {
    v: 1,
    uid: userId,
    spk: toBase64(signingPublicKey),
    sn: safetyNumber,
  };
  return btoa(JSON.stringify(payload));
}

/**
 * Decode a scanned QR payload and verify against the locally computed safety number.
 *
 * Returns { valid: true, peerUserId, peerSigningKey } on match,
 * or { valid: false, reason } on failure.
 */
export function verifySafetyNumberQR(qrData: string, expectedSafetyNumber: string): QRVerifyResult {
  let parsed: unknown;
  try {
    const json = atob(qrData);
    parsed = JSON.parse(json);
  } catch {
    return { valid: false, reason: "invalid_format" };
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("v" in parsed) ||
    !("uid" in parsed) ||
    !("spk" in parsed) ||
    !("sn" in parsed)
  ) {
    return { valid: false, reason: "invalid_format" };
  }

  const payload = parsed as SafetyNumberQRPayload;

  if (payload.v !== 1) {
    return { valid: false, reason: "version_unsupported" };
  }

  if (
    typeof payload.uid !== "string" ||
    typeof payload.spk !== "string" ||
    typeof payload.sn !== "string"
  ) {
    return { valid: false, reason: "invalid_format" };
  }

  if (payload.sn !== expectedSafetyNumber) {
    return { valid: false, reason: "mismatch" };
  }

  return { valid: true, peerUserId: payload.uid, peerSigningKey: payload.spk };
}
