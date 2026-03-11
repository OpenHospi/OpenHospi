/**
 * X3DH (Extended Triple Diffie-Hellman) key exchange.
 *
 * Establishes a shared secret between two parties for initializing
 * a Double Ratchet session. Supports offline session establishment
 * via pre-key bundles.
 *
 * Based on Signal's X3DH specification:
 * https://signal.org/docs/specifications/x3dh/
 */
import type { CryptoBackend } from "../backends/platform";

import { concatBytes } from "./encoding";
import { verifySignedPreKey } from "./keys";
import type { IdentityKeyPair, PreKeyBundle, X3DHResult } from "./types";

const X3DH_INFO = new TextEncoder().encode("OpenHospiX3DH");
const X3DH_SALT = new Uint8Array(32); // zeros

/**
 * Initiator side of X3DH (Alice → Bob).
 *
 * 1. Verifies Bob's signed pre-key signature
 * 2. Generates ephemeral X25519 key pair
 * 3. Computes 3 or 4 DH exchanges
 * 4. Derives shared secret via HKDF
 */
export async function x3dhInitiate(
  backend: CryptoBackend,
  ourIdentity: IdentityKeyPair,
  theirBundle: PreKeyBundle,
): Promise<X3DHResult> {
  // Verify the signed pre-key was actually signed by their identity
  const validSig = verifySignedPreKey(
    backend,
    theirBundle.signingKey,
    theirBundle.signedPreKeyPublic,
    theirBundle.signedPreKeySignature,
  );
  if (!validSig) {
    throw new Error("X3DH: signed pre-key signature verification failed");
  }

  // Generate ephemeral X25519 key pair
  const ephemeral = backend.generateX25519KeyPair();

  // Compute DH values
  const dh1 = backend.x25519(ourIdentity.dh.privateKey, theirBundle.signedPreKeyPublic);
  const dh2 = backend.x25519(ephemeral.privateKey, theirBundle.identityKey);
  const dh3 = backend.x25519(ephemeral.privateKey, theirBundle.signedPreKeyPublic);

  let ikm: Uint8Array;
  if (theirBundle.oneTimePreKeyPublic) {
    const dh4 = backend.x25519(ephemeral.privateKey, theirBundle.oneTimePreKeyPublic);
    ikm = concatBytes(dh1, dh2, dh3, dh4);
  } else {
    ikm = concatBytes(dh1, dh2, dh3);
  }

  // Derive 32-byte shared secret
  const sharedSecret = await backend.hkdf(ikm, X3DH_SALT, X3DH_INFO, 32);

  return {
    sharedSecret,
    ephemeralPublicKey: ephemeral.publicKey,
    usedSignedPreKeyId: theirBundle.signedPreKeyId,
    usedOneTimePreKeyId: theirBundle.oneTimePreKeyId,
  };
}

/**
 * Responder side of X3DH (Bob receives Alice's initial message).
 *
 * Bob uses his own pre-keys + Alice's identity and ephemeral keys
 * to derive the same shared secret.
 */
export async function x3dhRespond(
  backend: CryptoBackend,
  ourIdentity: IdentityKeyPair,
  ourSignedPreKeyPrivate: Uint8Array,
  ourOneTimePreKeyPrivate: Uint8Array | null,
  theirIdentityKey: Uint8Array,
  theirEphemeralKey: Uint8Array,
): Promise<Uint8Array> {
  // Compute DH values (mirrored from initiator)
  const dh1 = backend.x25519(ourSignedPreKeyPrivate, theirIdentityKey);
  const dh2 = backend.x25519(ourIdentity.dh.privateKey, theirEphemeralKey);
  const dh3 = backend.x25519(ourSignedPreKeyPrivate, theirEphemeralKey);

  let ikm: Uint8Array;
  if (ourOneTimePreKeyPrivate) {
    const dh4 = backend.x25519(ourOneTimePreKeyPrivate, theirEphemeralKey);
    ikm = concatBytes(dh1, dh2, dh3, dh4);
  } else {
    ikm = concatBytes(dh1, dh2, dh3);
  }

  return backend.hkdf(ikm, X3DH_SALT, X3DH_INFO, 32);
}
