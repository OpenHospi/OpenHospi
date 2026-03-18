import { getCryptoProvider } from "../primitives/CryptoProvider";

import { concat, encodeUtf8 } from "./encoding";

const SAFETY_NUMBER_VERSION = new Uint8Array([0x00, 0x00]);

/**
 * Generate a safety number for verifying identity between two users.
 * Based on the Signal Protocol's numeric fingerprint format.
 *
 * The safety number is a 60-digit string (12 groups of 5 digits).
 */
export function generateSafetyNumber(
  localUserId: string,
  localIdentityKey: Uint8Array,
  remoteUserId: string,
  remoteIdentityKey: Uint8Array,
): string {
  const localFingerprint = computeFingerprint(localUserId, localIdentityKey);
  const remoteFingerprint = computeFingerprint(remoteUserId, remoteIdentityKey);

  // The safety number is the sorted concatenation of both fingerprints
  // so both parties get the same number regardless of who initiates
  if (localUserId < remoteUserId) {
    return localFingerprint + remoteFingerprint;
  }
  return remoteFingerprint + localFingerprint;
}

function computeFingerprint(userId: string, identityKey: Uint8Array): string {
  const provider = getCryptoProvider();

  // Hash: HMAC(identityKey, version || userId || identityKey), iterated 5200 times
  let hash = concat(SAFETY_NUMBER_VERSION, encodeUtf8(userId), identityKey);

  for (let i = 0; i < 5200; i++) {
    hash = provider.hmacSha256(identityKey, concat(hash, identityKey));
  }

  // Convert first 30 bytes to 30 digits (each byte mod 100000, take 5 digits)
  let digits = "";
  for (let i = 0; i < 30; i += 5) {
    const value =
      ((hash[i] & 0xff) << 24) |
      ((hash[i + 1] & 0xff) << 16) |
      ((hash[i + 2] & 0xff) << 8) |
      (hash[i + 3] & 0xff);
    digits += String(Math.abs(value) % 100000).padStart(5, "0");
  }

  return digits;
}

/**
 * Encode a safety number and identity key into a QR code payload.
 */
export function encodeSafetyNumberQR(
  userId: string,
  identityKey: Uint8Array,
  safetyNumber: string,
): string {
  return JSON.stringify({
    v: 1,
    uid: userId,
    ik: Array.from(identityKey),
    sn: safetyNumber,
  });
}

/**
 * Verify a scanned QR code against the expected safety number.
 */
export function verifySafetyNumberQR(
  qrData: string,
  expectedSafetyNumber: string,
): { valid: boolean; remoteUserId: string } {
  try {
    const parsed = JSON.parse(qrData);
    if (parsed.v !== 1 || !parsed.uid || !parsed.sn) {
      return { valid: false, remoteUserId: "" };
    }
    return {
      valid: parsed.sn === expectedSafetyNumber,
      remoteUserId: parsed.uid,
    };
  } catch {
    return { valid: false, remoteUserId: "" };
  }
}
