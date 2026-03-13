import { bytesToUtf8, utf8ToBytes } from "../protocol/encoding";
import { groupEncrypt, groupDecrypt, StaleSenderKeyError } from "../protocol/group-cipher";
import {
  generateSenderKey,
  createDistributionMessage,
  processDistributionMessage,
  serializeDistributionMessage,
  deserializeDistributionMessage,
} from "../protocol/sender-key";
import type {
  SenderKeyState,
  GroupCiphertextPayload,
  ProtocolAddress,
  PreKeyWhisperMessage,
  WhisperMessage,
  MessageEnvelope,
} from "../protocol/types";
import type { SignalProtocolStore } from "../stores/types";

import {
  encryptForSession,
  processIncomingPreKeyMessage,
  decryptFromSession,
} from "./SessionManager";

/**
 * Get or create the local Sender Key for a conversation.
 */
export async function getOrCreateSenderKey(
  store: SignalProtocolStore,
  localAddress: ProtocolAddress,
  conversationId: string,
): Promise<{ state: SenderKeyState; isNew: boolean }> {
  const existing = await store.loadSenderKey(localAddress, conversationId);
  if (existing) return { state: existing, isNew: false };

  const state = generateSenderKey();
  await store.storeSenderKey(localAddress, conversationId, state);
  return { state, isNew: true };
}

/**
 * Create a Sender Key distribution message to send to a remote device.
 * The distribution is encrypted via the 1:1 session cipher.
 */
export async function distributeSenderKeyToDevice(
  store: SignalProtocolStore,
  localAddress: ProtocolAddress,
  remoteAddress: ProtocolAddress,
  conversationId: string,
  preKeyInfo?: {
    identityKey: Uint8Array;
    ephemeralKey: Uint8Array;
    signedPreKeyId: number;
    oneTimePreKeyId?: number;
    registrationId: number;
  },
): Promise<MessageEnvelope> {
  const { state } = await getOrCreateSenderKey(store, localAddress, conversationId);
  const distribution = createDistributionMessage(state);
  const serialized = utf8ToBytes(serializeDistributionMessage(distribution));

  return encryptForSession(store, remoteAddress, serialized, preKeyInfo);
}

/**
 * Process a received Sender Key distribution message.
 */
export async function receiveSenderKeyDistribution(
  store: SignalProtocolStore,
  senderAddress: ProtocolAddress,
  conversationId: string,
  envelope: MessageEnvelope,
): Promise<void> {
  let plaintext: Uint8Array;

  if (envelope.type === "prekey") {
    plaintext = await processIncomingPreKeyMessage(
      store,
      senderAddress,
      envelope.data as PreKeyWhisperMessage,
    );
  } else {
    plaintext = await decryptFromSession(store, senderAddress, envelope.data as WhisperMessage);
  }

  const distribution = deserializeDistributionMessage(bytesToUtf8(plaintext));
  const senderKeyState = processDistributionMessage(distribution);
  await store.storeSenderKey(senderAddress, conversationId, senderKeyState);
}

/**
 * Encrypt a message for a group conversation.
 */
export async function encryptGroupMessage(
  store: SignalProtocolStore,
  localAddress: ProtocolAddress,
  conversationId: string,
  plaintext: string,
  senderUserId: string,
): Promise<{ payload: GroupCiphertextPayload; senderKeyId: number }> {
  const { state } = await getOrCreateSenderKey(store, localAddress, conversationId);

  const { payload, updatedState } = await groupEncrypt(
    state,
    plaintext,
    conversationId,
    senderUserId,
  );

  await store.storeSenderKey(localAddress, conversationId, updatedState);

  return { payload, senderKeyId: state.senderKeyId };
}

/**
 * Decrypt a group message using the sender's stored Sender Key.
 */
export async function decryptGroupMessage(
  store: SignalProtocolStore,
  senderAddress: ProtocolAddress,
  conversationId: string,
  payload: GroupCiphertextPayload,
  senderUserId: string,
): Promise<string> {
  const state = await store.loadSenderKey(senderAddress, conversationId);
  if (!state) {
    throw new StaleSenderKeyError(
      `No sender key for ${senderAddress.name}.${senderAddress.deviceId} in conversation ${conversationId}`,
    );
  }

  const { plaintext, updatedState } = await groupDecrypt(
    state,
    payload,
    conversationId,
    senderUserId,
  );

  await store.storeSenderKey(senderAddress, conversationId, updatedState);

  return plaintext;
}

/**
 * Rotate the local Sender Key for a conversation (e.g., after member removal).
 * Returns the new state — caller is responsible for distributing to remaining members.
 */
export async function rotateSenderKey(
  store: SignalProtocolStore,
  localAddress: ProtocolAddress,
  conversationId: string,
): Promise<SenderKeyState> {
  // Delete old key
  await store.deleteSenderKey(localAddress, conversationId);

  // Generate new key
  const state = generateSenderKey();
  await store.storeSenderKey(localAddress, conversationId, state);

  return state;
}
