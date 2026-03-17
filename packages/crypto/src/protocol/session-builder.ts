import { initSessionAsInitiator } from "./double-ratchet";
import type { KeyPair, PreKeyBundle, SessionRecord, SessionState } from "./types";
import { x3dhInitiate } from "./x3dh";

/**
 * Build a new session from a pre-key bundle (initiator side).
 * This is called when Alice wants to send her first message to Bob.
 */
export function buildSessionFromBundle(
  identityKeyPair: KeyPair,
  identityPublicKey: Uint8Array,
  bundle: PreKeyBundle,
): {
  session: SessionRecord;
  ephemeralPublicKey: Uint8Array;
  usedOneTimePreKeyId?: number;
} {
  // Perform X3DH key agreement
  const x3dhResult = x3dhInitiate(identityKeyPair, bundle);

  // Initialize Double Ratchet as initiator
  const sessionState: SessionState = initSessionAsInitiator(
    x3dhResult.sharedSecret,
    bundle.identityKey,
    identityPublicKey,
    bundle.signedPreKey,
  );

  return {
    session: {
      state: sessionState,
      version: 3,
    },
    ephemeralPublicKey: x3dhResult.ephemeralKeyPair.publicKey,
    usedOneTimePreKeyId: x3dhResult.usedOneTimePreKeyId,
  };
}
