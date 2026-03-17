import { x25519 } from "@noble/curves/ed25519";
import { ed25519 } from "@noble/curves/ed25519";

import { getCryptoProvider } from "../primitives/CryptoProvider";
import type { KeyPair, PreKeyRecord, SignedPreKeyRecord } from "./types";

/** Generate an X25519 key pair for Diffie-Hellman key exchange. */
export function generateX25519KeyPair(): KeyPair {
  const provider = getCryptoProvider();
  const privateKey = provider.randomBytes(32);
  const publicKey = x25519.getPublicKey(privateKey);
  return { publicKey, privateKey };
}

/** Generate an Ed25519 key pair for digital signatures. */
export function generateEd25519KeyPair(): KeyPair {
  const provider = getCryptoProvider();
  const privateKey = provider.randomBytes(32);
  const publicKey = ed25519.getPublicKey(privateKey);
  return { publicKey, privateKey };
}

/** Perform X25519 Diffie-Hellman key exchange. */
export function x25519Dh(privateKey: Uint8Array, publicKey: Uint8Array): Uint8Array {
  return x25519.getSharedSecret(privateKey, publicKey);
}

/** Sign data with Ed25519. */
export function ed25519Sign(privateKey: Uint8Array, message: Uint8Array): Uint8Array {
  return ed25519.sign(message, privateKey);
}

/** Verify an Ed25519 signature. */
export function ed25519Verify(
  publicKey: Uint8Array,
  message: Uint8Array,
  signature: Uint8Array,
): boolean {
  try {
    return ed25519.verify(signature, message, publicKey);
  } catch {
    return false;
  }
}

/** Generate an identity key pair (X25519 for DH, Ed25519 for signing). */
export function generateIdentityKeyPair(): {
  dhKeyPair: KeyPair;
  signingKeyPair: KeyPair;
} {
  return {
    dhKeyPair: generateX25519KeyPair(),
    signingKeyPair: generateEd25519KeyPair(),
  };
}

/** Generate a registration ID (random 14-bit unsigned integer). */
export function generateRegistrationId(): number {
  const provider = getCryptoProvider();
  const bytes = provider.randomBytes(2);
  return ((bytes[0] << 8) | bytes[1]) & 0x3fff;
}

/** Generate a signed pre-key. The SPK is signed with the identity signing key. */
export function generateSignedPreKey(
  identitySigningKey: Uint8Array,
  keyId: number,
): SignedPreKeyRecord {
  const keyPair = generateX25519KeyPair();
  const signature = ed25519Sign(identitySigningKey, keyPair.publicKey);
  return {
    keyId,
    keyPair,
    signature,
    timestamp: Date.now(),
  };
}

/** Generate a batch of one-time pre-keys. */
export function generatePreKeys(startId: number, count: number): PreKeyRecord[] {
  const preKeys: PreKeyRecord[] = [];
  for (let i = 0; i < count; i++) {
    preKeys.push({
      keyId: startId + i,
      keyPair: generateX25519KeyPair(),
    });
  }
  return preKeys;
}
