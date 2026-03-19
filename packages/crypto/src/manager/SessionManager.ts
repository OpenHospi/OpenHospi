import { initSessionAsResponder } from "../protocol/double-ratchet";
import { buildSessionFromBundle } from "../protocol/session-builder";
import {
  createPreKeyMessage,
  deserializePreKeyWhisperMessage,
  isPreKeyWhisperMessage,
  sessionDecrypt,
  sessionEncrypt,
} from "../protocol/session-cipher";
import type { PreKeyBundle, ProtocolAddress, SessionRecord } from "../protocol/types";
import { x3dhRespond } from "../protocol/x3dh";
import type { ProtocolStore } from "../stores/types";

/**
 * Establish a new 1:1 session with a remote device using their pre-key bundle.
 * This is the initiator (Alice) side of X3DH + Double Ratchet.
 */
export async function establishSession(
  store: ProtocolStore,
  address: ProtocolAddress,
  bundle: PreKeyBundle,
): Promise<void> {
  const identityKeyPair = await store.getIdentityKeyPair();

  const { session } = buildSessionFromBundle(identityKeyPair, identityKeyPair.publicKey, bundle);

  // Save the remote identity key
  await store.saveIdentity(address, bundle.identityKey);

  // Save the session
  await store.storeSession(address, session);
}

/**
 * Encrypt a message for a 1:1 session.
 * If the session has a pendingPreKey (first message from initiator), wraps the
 * WhisperMessage in a PreKeyWhisperMessage so the recipient can establish the session.
 * If no session exists, throws — call establishSession first.
 */
export async function encrypt1to1(
  store: ProtocolStore,
  address: ProtocolAddress,
  plaintext: Uint8Array,
): Promise<Uint8Array> {
  const session = await store.loadSession(address);
  if (!session) {
    throw new Error(`No session for ${address.userId}:${address.deviceId}`);
  }

  const { session: updatedSession, serialised } = sessionEncrypt(session, plaintext);

  // If this is the first message in a new session, wrap as PreKeyWhisperMessage
  if (session.pendingPreKey) {
    const identityKeyPair = await store.getIdentityKeyPair();
    const registrationId = await store.getLocalRegistrationId();

    const preKeyMessage = createPreKeyMessage(
      registrationId,
      session.pendingPreKey.signedPreKeyId,
      session.pendingPreKey.baseKey,
      identityKeyPair.publicKey,
      serialised,
      session.pendingPreKey.preKeyId,
    );

    // Clear pendingPreKey now that the PreKeyWhisperMessage has been sent
    const clearedSession: SessionRecord = {
      ...updatedSession,
      pendingPreKey: undefined,
    };
    await store.storeSession(address, clearedSession);

    return preKeyMessage;
  }

  await store.storeSession(address, updatedSession);

  return serialised;
}

/**
 * Decrypt a received 1:1 message.
 * Handles both PreKeyWhisperMessages (first message) and regular WhisperMessages.
 */
export async function decrypt1to1(
  store: ProtocolStore,
  address: ProtocolAddress,
  data: Uint8Array,
): Promise<Uint8Array> {
  if (isPreKeyWhisperMessage(data)) {
    return decryptPreKeyMessage(store, address, data);
  }

  const session = await store.loadSession(address);
  if (!session) {
    throw new Error(`No session for ${address.userId}:${address.deviceId}`);
  }

  const { session: updatedSession, plaintext } = sessionDecrypt(session, data);
  await store.storeSession(address, updatedSession);

  return plaintext;
}

async function decryptPreKeyMessage(
  store: ProtocolStore,
  address: ProtocolAddress,
  data: Uint8Array,
): Promise<Uint8Array> {
  const preKeyMsg = deserializePreKeyWhisperMessage(data);

  // Verify the sender's identity key is trusted (TOFU or previously seen)
  const isTrusted = await store.isTrustedIdentity(address, preKeyMsg.identityKey);
  if (!isTrusted) {
    throw new Error(
      `Identity key changed for ${address.userId}:${address.deviceId}. ` +
        "The remote user's identity key has changed. This could indicate a security issue.",
    );
  }

  // Load our keys
  const identityKeyPair = await store.getIdentityKeyPair();
  const signedPreKey = await store.loadSignedPreKey(preKeyMsg.signedPreKeyId);

  let oneTimePreKey = null;
  if (preKeyMsg.preKeyId !== undefined) {
    const pk = await store.loadPreKey(preKeyMsg.preKeyId);
    oneTimePreKey = pk.keyPair;
  }

  // Perform X3DH as responder
  const sharedSecret = x3dhRespond(
    identityKeyPair,
    signedPreKey.keyPair,
    oneTimePreKey,
    preKeyMsg.identityKey,
    preKeyMsg.baseKey,
  );

  // Initialize session as responder
  const sessionState = initSessionAsResponder(
    sharedSecret,
    preKeyMsg.identityKey,
    identityKeyPair.publicKey,
    signedPreKey.keyPair,
  );

  const session: SessionRecord = { state: sessionState, version: 3 };

  // Decrypt the inner WhisperMessage
  const { session: updatedSession, plaintext } = sessionDecrypt(session, preKeyMsg.message);

  // Save identity and session
  await store.saveIdentity(address, preKeyMsg.identityKey);
  await store.storeSession(address, updatedSession);

  // Remove consumed one-time pre-key
  if (preKeyMsg.preKeyId !== undefined) {
    await store.removePreKey(preKeyMsg.preKeyId);
  }

  return plaintext;
}
