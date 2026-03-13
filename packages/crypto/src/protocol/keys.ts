import { getCryptoProvider } from "../primitives/CryptoProvider";

import type { IdentityKeyPair, SignedPreKey, OneTimePreKey } from "./types";

/**
 * Generate a new Ed25519 identity key pair with derived X25519 DH keys.
 */
export function generateIdentityKeyPair(): IdentityKeyPair {
  const crypto = getCryptoProvider();
  const signingKeyPair = crypto.ed25519GenerateKeyPair();
  const dhKeyPair = {
    publicKey: crypto.edToX25519Public(signingKeyPair.publicKey),
    privateKey: crypto.edToX25519Private(signingKeyPair.privateKey),
  };
  return { signingKeyPair, dhKeyPair };
}

/**
 * Generate a registration ID (random uint32, used as device identifier).
 */
export function generateRegistrationId(): number {
  const crypto = getCryptoProvider();
  const bytes = crypto.randomBytes(4);
  return ((bytes[0]! << 24) | (bytes[1]! << 16) | (bytes[2]! << 8) | bytes[3]!) >>> 0;
}

/**
 * Generate a signed prekey. The public X25519 key is signed with the
 * identity Ed25519 signing key for authenticity.
 */
export function generateSignedPreKey(
  identitySigningPrivateKey: Uint8Array,
  keyId: number,
): SignedPreKey {
  const crypto = getCryptoProvider();
  const keyPair = crypto.x25519GenerateKeyPair();
  const signature = crypto.ed25519Sign(identitySigningPrivateKey, keyPair.publicKey);
  return { keyId, keyPair, signature };
}

/**
 * Verify that a signed prekey's signature is valid.
 */
export function verifySignedPreKey(
  identitySigningPublicKey: Uint8Array,
  publicKey: Uint8Array,
  signature: Uint8Array,
): boolean {
  const crypto = getCryptoProvider();
  return crypto.ed25519Verify(identitySigningPublicKey, publicKey, signature);
}

/**
 * Generate a batch of one-time prekeys.
 */
export function generateOneTimePreKeys(startId: number, count: number): OneTimePreKey[] {
  const crypto = getCryptoProvider();
  const keys: OneTimePreKey[] = [];
  for (let i = 0; i < count; i++) {
    keys.push({
      keyId: startId + i,
      keyPair: crypto.x25519GenerateKeyPair(),
    });
  }
  return keys;
}
