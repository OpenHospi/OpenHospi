import { getCryptoProvider } from "../primitives/CryptoProvider";

import { concat } from "./encoding";
import { ed25519Verify, generateX25519KeyPair, x25519Dh } from "./keys";
import type { KeyPair, PreKeyBundle } from "./types";

const X3DH_INFO = new TextEncoder().encode("WhisperText");
const EMPTY_SALT = new Uint8Array(32); // 32 zero bytes

export interface X3DHResult {
  sharedSecret: Uint8Array;
  ephemeralKeyPair: KeyPair;
  usedOneTimePreKeyId?: number;
}

/**
 * X3DH key agreement — initiator side (Alice).
 *
 * Performs 3 or 4 DH operations:
 *   DH1 = DH(IK_A, SPK_B)
 *   DH2 = DH(EK_A, IK_B)
 *   DH3 = DH(EK_A, SPK_B)
 *   DH4 = DH(EK_A, OPK_B)  // only if OPK available
 *
 * Then derives shared secret:
 *   SK = HKDF(DH1 || DH2 || DH3 [|| DH4], salt=0, info="WhisperText")
 *
 * IMPORTANT: Verifies SPK signature before proceeding.
 */
export function x3dhInitiate(identityKeyPair: KeyPair, bundle: PreKeyBundle): X3DHResult {
  // Verify the signed pre-key signature
  if (!ed25519Verify(bundle.identityKey, bundle.signedPreKey, bundle.signedPreKeySignature)) {
    throw new Error("X3DH: Signed pre-key signature verification failed");
  }

  const provider = getCryptoProvider();

  // Generate ephemeral key pair
  const ephemeralKeyPair = generateX25519KeyPair();

  // Compute DH values
  const dh1 = x25519Dh(identityKeyPair.privateKey, bundle.signedPreKey);
  const dh2 = x25519Dh(ephemeralKeyPair.privateKey, bundle.identityKey);
  const dh3 = x25519Dh(ephemeralKeyPair.privateKey, bundle.signedPreKey);

  let dhConcat: Uint8Array;
  let usedOneTimePreKeyId: number | undefined;

  if (bundle.oneTimePreKey && bundle.oneTimePreKeyId !== undefined) {
    const dh4 = x25519Dh(ephemeralKeyPair.privateKey, bundle.oneTimePreKey);
    dhConcat = concat(dh1, dh2, dh3, dh4);
    usedOneTimePreKeyId = bundle.oneTimePreKeyId;
  } else {
    dhConcat = concat(dh1, dh2, dh3);
  }

  // Derive shared secret via HKDF
  const sharedSecret = provider.hkdf(dhConcat, EMPTY_SALT, X3DH_INFO, 32);

  return {
    sharedSecret,
    ephemeralKeyPair,
    usedOneTimePreKeyId,
  };
}

/**
 * X3DH key agreement — responder side (Bob).
 *
 * Called when receiving a PreKeyWhisperMessage from Alice.
 */
export function x3dhRespond(
  identityKeyPair: KeyPair,
  signedPreKey: KeyPair,
  oneTimePreKey: KeyPair | null,
  remoteIdentityKey: Uint8Array,
  remoteEphemeralKey: Uint8Array,
): Uint8Array {
  const provider = getCryptoProvider();

  const dh1 = x25519Dh(signedPreKey.privateKey, remoteIdentityKey);
  const dh2 = x25519Dh(identityKeyPair.privateKey, remoteEphemeralKey);
  const dh3 = x25519Dh(signedPreKey.privateKey, remoteEphemeralKey);

  let dhConcat: Uint8Array;

  if (oneTimePreKey) {
    const dh4 = x25519Dh(oneTimePreKey.privateKey, remoteEphemeralKey);
    dhConcat = concat(dh1, dh2, dh3, dh4);
  } else {
    dhConcat = concat(dh1, dh2, dh3);
  }

  return provider.hkdf(dhConcat, EMPTY_SALT, X3DH_INFO, 32);
}
