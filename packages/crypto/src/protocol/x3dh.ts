import { getCryptoProvider } from "../primitives/CryptoProvider";

import { concatBytes, utf8ToBytes } from "./encoding";
import type { IdentityKeyPair, PreKeyBundle, X3DHResult, SessionState, KeyPair } from "./types";

const HKDF_INFO = utf8ToBytes("WhisperText");
const HKDF_SALT = new Uint8Array(32); // 32 zero bytes per Signal spec

/**
 * Alice initiates X3DH with Bob's prekey bundle.
 * Returns the shared secret + session initialization data.
 */
export async function x3dhInitiate(
  localIdentity: IdentityKeyPair,
  remoteBundle: PreKeyBundle,
): Promise<X3DHResult> {
  const crypto = getCryptoProvider();

  // Generate ephemeral key pair
  const ephemeralKeyPair = crypto.x25519GenerateKeyPair();

  // 4 DH operations per Signal spec
  const dh1 = crypto.x25519SharedSecret(
    localIdentity.dhKeyPair.privateKey,
    remoteBundle.signedPreKeyPublic,
  );
  const dh2 = crypto.x25519SharedSecret(ephemeralKeyPair.privateKey, remoteBundle.identityKey);
  const dh3 = crypto.x25519SharedSecret(
    ephemeralKeyPair.privateKey,
    remoteBundle.signedPreKeyPublic,
  );

  let masterSecret: Uint8Array;
  if (remoteBundle.oneTimePreKeyPublic) {
    const dh4 = crypto.x25519SharedSecret(
      ephemeralKeyPair.privateKey,
      remoteBundle.oneTimePreKeyPublic,
    );
    masterSecret = concatBytes(dh1, dh2, dh3, dh4);
  } else {
    masterSecret = concatBytes(dh1, dh2, dh3);
  }

  const sharedSecret = await crypto.hkdf(masterSecret, HKDF_SALT, HKDF_INFO, 64);

  return {
    sharedSecret,
    ephemeralKeyPair,
    usedOneTimePreKeyId: remoteBundle.oneTimePreKeyId,
  };
}

/**
 * Bob processes a PreKeyWhisperMessage to complete X3DH.
 * Returns the same shared secret Alice derived.
 */
export async function x3dhRespond(
  localIdentity: IdentityKeyPair,
  localSignedPreKey: KeyPair,
  localOneTimePreKey: KeyPair | null,
  remoteIdentityKey: Uint8Array,
  remoteEphemeralKey: Uint8Array,
): Promise<Uint8Array> {
  const crypto = getCryptoProvider();

  const dh1 = crypto.x25519SharedSecret(localSignedPreKey.privateKey, remoteIdentityKey);
  const dh2 = crypto.x25519SharedSecret(localIdentity.dhKeyPair.privateKey, remoteEphemeralKey);
  const dh3 = crypto.x25519SharedSecret(localSignedPreKey.privateKey, remoteEphemeralKey);

  let masterSecret: Uint8Array;
  if (localOneTimePreKey) {
    const dh4 = crypto.x25519SharedSecret(localOneTimePreKey.privateKey, remoteEphemeralKey);
    masterSecret = concatBytes(dh1, dh2, dh3, dh4);
  } else {
    masterSecret = concatBytes(dh1, dh2, dh3);
  }

  return crypto.hkdf(masterSecret, HKDF_SALT, HKDF_INFO, 64);
}

/**
 * Initialize a session state from X3DH output (Alice's side).
 */
export function initializeSessionFromX3DH(
  sharedSecret: Uint8Array,
  localRatchetKeyPair: KeyPair,
  remoteRatchetPublicKey: Uint8Array,
  localRegistrationId: number,
  remoteRegistrationId: number,
): SessionState {
  return {
    rootKey: sharedSecret.slice(0, 32),
    sendingChain: {
      chainKey: sharedSecret.slice(32, 64),
      messageCounter: 0,
    },
    receivingChain: null,
    localRatchetKeyPair,
    remoteRatchetPublicKey,
    previousSendingChainLength: 0,
    localRegistrationId,
    remoteRegistrationId,
  };
}

/**
 * Initialize a session state from X3DH output (Bob's side).
 * Bob's receiving chain is the initial chain key; sending chain
 * will be established on first reply.
 */
export function initializeSessionFromX3DHResponder(
  sharedSecret: Uint8Array,
  localRatchetKeyPair: KeyPair,
  remoteRatchetPublicKey: Uint8Array,
  localRegistrationId: number,
  remoteRegistrationId: number,
): SessionState {
  return {
    rootKey: sharedSecret.slice(0, 32),
    sendingChain: {
      chainKey: new Uint8Array(32), // will be set on first DH ratchet step
      messageCounter: 0,
    },
    receivingChain: {
      chainKey: sharedSecret.slice(32, 64),
      messageCounter: 0,
    },
    localRatchetKeyPair,
    remoteRatchetPublicKey,
    previousSendingChainLength: 0,
    localRegistrationId,
    remoteRegistrationId,
  };
}
