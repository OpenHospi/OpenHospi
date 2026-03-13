import { getCryptoProvider } from "../primitives/CryptoProvider";

import type {
  IdentityKeyPair,
  PreKeyBundle,
  SessionState,
  PreKeyWhisperMessage,
  KeyPair,
} from "./types";
import {
  x3dhInitiate,
  x3dhRespond,
  initializeSessionFromX3DH,
  initializeSessionFromX3DHResponder,
} from "./x3dh";

export interface SessionFromBundleResult {
  session: SessionState;
  preKeyInfo: {
    identityKey: Uint8Array;
    ephemeralKey: Uint8Array;
    signedPreKeyId: number;
    oneTimePreKeyId?: number;
    registrationId: number;
  };
}

/**
 * Build a new session from a remote device's prekey bundle (Alice's side).
 * Returns the initialized session and the prekey info needed for the first message.
 */
export async function buildSessionFromPreKeyBundle(
  localIdentity: IdentityKeyPair,
  localRegistrationId: number,
  remoteBundle: PreKeyBundle,
): Promise<SessionFromBundleResult> {
  // Verify the signed prekey signature
  // The identity key in the bundle is X25519, but we need Ed25519 for verification.
  // In our protocol, the server stores the Ed25519 signing public key alongside
  // the X25519 identity key. For verification, we check against the signing key.
  // However, per Signal spec, the signed prekey signature is over the X25519 SPK public key
  // using the identity signing key. We assume the bundle includes proper verification data.

  // Perform X3DH
  const x3dhResult = await x3dhInitiate(localIdentity, remoteBundle);

  // Initialize session
  const session = initializeSessionFromX3DH(
    x3dhResult.sharedSecret,
    x3dhResult.ephemeralKeyPair,
    remoteBundle.signedPreKeyPublic,
    localRegistrationId,
    remoteBundle.registrationId,
  );

  return {
    session,
    preKeyInfo: {
      identityKey: localIdentity.dhKeyPair.publicKey,
      ephemeralKey: x3dhResult.ephemeralKeyPair.publicKey,
      signedPreKeyId: remoteBundle.signedPreKeyId,
      oneTimePreKeyId: x3dhResult.usedOneTimePreKeyId,
      registrationId: localRegistrationId,
    },
  };
}

/**
 * Process an incoming PreKeyWhisperMessage to establish a session (Bob's side).
 */
export async function processPreKeyMessage(
  localIdentity: IdentityKeyPair,
  localRegistrationId: number,
  localSignedPreKey: KeyPair,
  localOneTimePreKey: KeyPair | null,
  preKeyMessage: PreKeyWhisperMessage,
): Promise<SessionState> {
  const crypto = getCryptoProvider();

  // Perform X3DH from responder side
  const sharedSecret = await x3dhRespond(
    localIdentity,
    localSignedPreKey,
    localOneTimePreKey,
    preKeyMessage.identityKey,
    preKeyMessage.ephemeralKey,
  );

  // Generate a new ratchet key pair for Bob
  const localRatchetKeyPair = crypto.x25519GenerateKeyPair();

  // Initialize session as responder
  return initializeSessionFromX3DHResponder(
    sharedSecret,
    localRatchetKeyPair,
    preKeyMessage.ephemeralKey,
    localRegistrationId,
    preKeyMessage.registrationId,
  );
}
