import { getCryptoProvider } from "../primitives/CryptoProvider";

import { concatBytes, toBase64, fromBase64, utf8ToBytes } from "./encoding";

const ITERATIONS = 5200;
const VERSION = 1;

export interface QRVerifyResult {
  valid: boolean;
  remoteUserId: string;
}

/**
 * Generate a 60-digit safety number from two users' Ed25519 signing public keys.
 * The number is symmetric: both users derive the same result.
 */
export async function generateSafetyNumber(
  localUserId: string,
  localSigningPublicKey: Uint8Array,
  remoteUserId: string,
  remoteSigningPublicKey: Uint8Array,
): Promise<string> {
  const localFingerprint = await computeFingerprint(localUserId, localSigningPublicKey);
  const remoteFingerprint = await computeFingerprint(remoteUserId, remoteSigningPublicKey);

  // Sort deterministically so both users get the same number
  const [first, second] =
    localUserId < remoteUserId
      ? [localFingerprint, remoteFingerprint]
      : [remoteFingerprint, localFingerprint];

  return formatSafetyNumber(first!) + formatSafetyNumber(second!);
}

/**
 * Encode safety number data into a QR payload for scanning.
 */
export function encodeSafetyNumberQR(
  userId: string,
  signingPublicKey: Uint8Array,
  safetyNumber: string,
): string {
  return toBase64(
    utf8ToBytes(
      JSON.stringify({
        v: VERSION,
        uid: userId,
        spk: toBase64(signingPublicKey),
        sn: safetyNumber,
      }),
    ),
  );
}

/**
 * Verify a scanned QR code against the locally computed safety number.
 */
export function verifySafetyNumberQR(
  qrPayload: string,
  expectedSafetyNumber: string,
): QRVerifyResult {
  try {
    const decoded = JSON.parse(new TextDecoder().decode(fromBase64(qrPayload))) as {
      v: number;
      uid: string;
      spk: string;
      sn: string;
    };

    if (decoded.v !== VERSION) {
      return { valid: false, remoteUserId: decoded.uid };
    }

    return {
      valid: decoded.sn === expectedSafetyNumber,
      remoteUserId: decoded.uid,
    };
  } catch {
    return { valid: false, remoteUserId: "" };
  }
}

// ── Internal ──

async function computeFingerprint(
  userId: string,
  signingPublicKey: Uint8Array,
): Promise<Uint8Array> {
  const crypto = getCryptoProvider();

  // Iteratively hash: SHA-512(SHA-512(...(version || publicKey || userId)...))
  let hash = concatBytes(new Uint8Array([0, VERSION]), signingPublicKey, utf8ToBytes(userId));

  for (let i = 0; i < ITERATIONS; i++) {
    hash = concatBytes(hash, signingPublicKey);
    // Use HMAC with the public key as key for iterated hashing
    hash = await crypto.hmacSha256(signingPublicKey, hash);
  }

  return hash;
}

function formatSafetyNumber(fingerprint: Uint8Array): string {
  // Extract 30 digits (5 groups of 6 digits, but we use 5 groups of 6 = 30 per side)
  let result = "";
  for (let i = 0; i < 30 && i < fingerprint.length * 2; i++) {
    const byteIdx = Math.floor(i / 2);
    const val = i % 2 === 0 ? fingerprint[byteIdx]! >> 4 : fingerprint[byteIdx]! & 0x0f;
    result += (val % 10).toString();
  }
  return result;
}
