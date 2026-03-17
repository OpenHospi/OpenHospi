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
import type { SignalProtocolStore } from "../stores/types";

/**
 * Establish a new 1:1 session with a remote device using their pre-key bundle.
 * This is the initiator (Alice) side of X3DH + Double Ratchet.
 */
export async function establishSession(
  store: SignalProtocolStore,
  address: ProtocolAddress,
  bundle: PreKeyBundle,
): Promise<void> {
  const identityKeyPair = await store.getIdentityKeyPair();
  const registrationId = await store.getLocalRegistrationId();

  const { session, ephemeralPublicKey, usedOneTimePreKeyId } = buildSessionFromBundle(
    identityKeyPair,
    identityKeyPair.publicKey,
    bundle,
  );

  // Save the remote identity key
  await store.saveIdentity(address, bundle.identityKey);

  // Save the session
  await store.storeSession(address, session);
}

/**
 * Encrypt a message for a 1:1 session.
 * If no session exists, throws — call establishSession first.
 */
export async function encrypt1to1(
  store: SignalProtocolStore,
  address: ProtocolAddress,
  plaintext: Uint8Array,
): Promise<Uint8Array> {
  const session = await store.loadSession(address);
  if (!session) {
    throw new Error(`No session for ${address.userId}:${address.deviceId}`);
  }

  const registrationId = await store.getLocalRegistrationId();
  const { session: updatedSession, serialised } = sessionEncrypt(session, plaintext);

  await store.storeSession(address, updatedSession);

  return serialised;
}

/**
 * Decrypt a received 1:1 message.
 * Handles both PreKeyWhisperMessages (first message) and regular WhisperMessages.
 */
export async function decrypt1to1(
  store: SignalProtocolStore,
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
  store: SignalProtocolStore,
  address: ProtocolAddress,
  data: Uint8Array,
): Promise<Uint8Array> {
  const preKeyMsg = deserializePreKeyWhisperMessage(data);

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
