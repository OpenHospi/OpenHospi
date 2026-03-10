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
