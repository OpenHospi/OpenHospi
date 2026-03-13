import { buildSessionFromPreKeyBundle, processPreKeyMessage } from "../protocol/session-builder";
import { sessionEncrypt, sessionDecrypt } from "../protocol/session-cipher";
import type {
  PreKeyBundle,
  PreKeyWhisperMessage,
  WhisperMessage,
  MessageEnvelope,
  ProtocolAddress,
} from "../protocol/types";
import type { SignalProtocolStore } from "../stores/types";

/**
 * Establish a new session with a remote device from their prekey bundle.
 * Stores the session and returns the prekey info needed for the first message.
 */
export async function establishSession(
  store: SignalProtocolStore,
  remoteAddress: ProtocolAddress,
  remoteBundle: PreKeyBundle,
): Promise<{
  preKeyInfo: {
    identityKey: Uint8Array;
    ephemeralKey: Uint8Array;
    signedPreKeyId: number;
    oneTimePreKeyId?: number;
    registrationId: number;
  };
}> {
  const localIdentity = await store.getIdentityKeyPair();
  const localRegistrationId = await store.getLocalRegistrationId();

  const { session, preKeyInfo } = await buildSessionFromPreKeyBundle(
    localIdentity,
    localRegistrationId,
    remoteBundle,
  );

  await store.storeSession(remoteAddress, session);
  await store.saveIdentity(remoteAddress, remoteBundle.identityKey);

  return { preKeyInfo };
}

/**
 * Process an incoming PreKeyWhisperMessage to establish a session.
 * Decrypts the first message and stores the new session.
 */
export async function processIncomingPreKeyMessage(
  store: SignalProtocolStore,
  senderAddress: ProtocolAddress,
  preKeyMessage: PreKeyWhisperMessage,
): Promise<Uint8Array> {
  const localIdentity = await store.getIdentityKeyPair();
  const localRegistrationId = await store.getLocalRegistrationId();

  // Load the signed prekey used in the exchange
  const signedPreKey = await store.loadSignedPreKey(preKeyMessage.signedPreKeyId);

  // Load one-time prekey if used
  let oneTimePreKeyPair = null;
  if (preKeyMessage.oneTimePreKeyId !== undefined) {
    const otp = await store.loadPreKey(preKeyMessage.oneTimePreKeyId);
    oneTimePreKeyPair = otp.keyPair;
  }

  // Build session from responder side
  const session = await processPreKeyMessage(
    localIdentity,
    localRegistrationId,
    signedPreKey.keyPair,
    oneTimePreKeyPair,
    preKeyMessage,
  );

  // Decrypt the enclosed whisper message
  const { plaintext, updatedSession, updatedSkippedKeys } = await sessionDecrypt(
    session,
    preKeyMessage.message,
  );

  // Store the session
  await store.storeSession(senderAddress, updatedSession);
  await store.saveIdentity(senderAddress, preKeyMessage.identityKey);
  await store.storeSkippedKeys(senderAddress, updatedSkippedKeys);

  // Remove used one-time prekey
  if (preKeyMessage.oneTimePreKeyId !== undefined) {
    await store.removePreKey(preKeyMessage.oneTimePreKeyId);
  }

  return plaintext;
}

/**
 * Encrypt a message for a remote device using their established session.
 * If no session exists, throws an error — establish a session first.
 */
export async function encryptForSession(
  store: SignalProtocolStore,
  remoteAddress: ProtocolAddress,
  plaintext: Uint8Array,
  preKeyInfo?: {
    identityKey: Uint8Array;
    ephemeralKey: Uint8Array;
    signedPreKeyId: number;
    oneTimePreKeyId?: number;
    registrationId: number;
  },
): Promise<MessageEnvelope> {
  const session = await store.loadSession(remoteAddress);
  if (!session) {
    throw new Error(`No session with ${remoteAddress.name}.${remoteAddress.deviceId}`);
  }

  const { envelope, updatedSession } = await sessionEncrypt(session, plaintext, preKeyInfo);
  await store.storeSession(remoteAddress, updatedSession);

  return envelope;
}

/**
 * Decrypt a message from a remote device using their established session.
 */
export async function decryptFromSession(
  store: SignalProtocolStore,
  senderAddress: ProtocolAddress,
  message: WhisperMessage,
): Promise<Uint8Array> {
  const session = await store.loadSession(senderAddress);
  if (!session) {
    throw new Error(`No session with ${senderAddress.name}.${senderAddress.deviceId}`);
  }

  const skippedKeys = await store.loadSkippedKeys(senderAddress);
  const { plaintext, updatedSession, updatedSkippedKeys } = await sessionDecrypt(
    session,
    message,
    skippedKeys,
  );

  await store.storeSession(senderAddress, updatedSession);
  await store.storeSkippedKeys(senderAddress, updatedSkippedKeys);

  return plaintext;
}
