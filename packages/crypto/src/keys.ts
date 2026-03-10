/**
 * Key generation for Signal Protocol:
 * - Identity key pair (Ed25519 signing + derived X25519 DH)
 * - Signed pre-keys (X25519 + Ed25519 signature)
 * - One-time pre-keys (X25519 batch)
 */
import type { CryptoBackend } from "./platform";
import type { IdentityKeyPair, KeyPair, OneTimePreKey, SignedPreKey } from "./types";

/**
 * Generate an identity key pair: Ed25519 for signing, X25519 for DH.
 * The X25519 pair is deterministically derived from the Ed25519 pair.
 */
export function generateIdentityKeyPair(backend: CryptoBackend): IdentityKeyPair {
  const signing = backend.generateEd25519KeyPair();
  const dh: KeyPair = {
    publicKey: backend.edToX25519Public(signing.publicKey),
    privateKey: backend.edToX25519Private(signing.privateKey),
  };
  return { signing, dh };
}

/**
 * Generate a signed pre-key: X25519 key pair signed with the identity Ed25519 key.
 * The signature covers the X25519 public key to prove it belongs to this identity.
 */
export function generateSignedPreKey(
  backend: CryptoBackend,
  identitySigningPrivateKey: Uint8Array,
  keyId: number,
): SignedPreKey {
  const keyPair = backend.generateX25519KeyPair();
  const signature = backend.ed25519Sign(identitySigningPrivateKey, keyPair.publicKey);
  return { keyId, keyPair, signature };
}

/**
 * Generate a batch of one-time pre-keys (X25519 pairs).
 * Each gets a sequential keyId starting from startKeyId.
 */
export function generateOneTimePreKeys(
  backend: CryptoBackend,
  startKeyId: number,
  count: number,
): OneTimePreKey[] {
  const keys: OneTimePreKey[] = [];
  for (let i = 0; i < count; i++) {
    keys.push({
      keyId: startKeyId + i,
      keyPair: backend.generateX25519KeyPair(),
    });
  }
  return keys;
}

/**
 * Verify a signed pre-key's signature against the identity signing public key.
 * Returns true if the SPK was signed by the claimed identity.
 */
export function verifySignedPreKey(
  backend: CryptoBackend,
  signingPublicKey: Uint8Array,
  preKeyPublic: Uint8Array,
  signature: Uint8Array,
): boolean {
  return backend.ed25519Verify(signingPublicKey, preKeyPublic, signature);
}
