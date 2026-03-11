/**
 * Double Ratchet algorithm for per-message forward secrecy and break-in recovery.
 *
 * Based on Signal's Double Ratchet specification:
 * https://signal.org/docs/specifications/doubleratchet/
 *
 * Each message gets a unique encryption key derived from the ratchet state.
 * DH ratchet steps occur on every send/receive, providing break-in recovery.
 */
import { MAX_SKIP_MESSAGE_KEYS } from "@openhospi/shared/constants";

import type { CryptoBackend } from "../backends/platform";

import { toBase64, fromBase64 } from "./encoding";
import { encrypt, decrypt, encodeHeaderAsAad } from "./encryption";
import { kdfChainStep, kdfRootStep } from "./kdf-chain";
import type {
  EncryptedMessage,
  MessageHeader,
  RatchetState,
  SerializedRatchetState,
  SerializedSkippedKeyEntry,
  SkippedKeyEntry,
} from "./types";

/**
 * Initialize the ratchet as the X3DH initiator (Alice).
 * Alice has the shared secret and Bob's signed pre-key (first ratchet public key).
 */
export async function initializeSender(
  backend: CryptoBackend,
  sharedSecret: Uint8Array,
  recipientRatchetPublicKey: Uint8Array,
): Promise<RatchetState> {
  // Generate our first DH ratchet key pair
  const dhSendingKeyPair = backend.generateX25519KeyPair();

  // Perform first DH ratchet step
  const dhOutput = backend.x25519(dhSendingKeyPair.privateKey, recipientRatchetPublicKey);
  const { newRootKey, chainKey } = await kdfRootStep(backend, sharedSecret, dhOutput);

  return {
    rootKey: newRootKey,
    sendingChainKey: chainKey,
    receivingChainKey: null,
    dhSendingKeyPair,
    dhReceivingPublicKey: recipientRatchetPublicKey,
    sendingChainLength: 0,
    receivingChainLength: 0,
    previousSendingChainLength: 0,
    skippedMessageKeys: [],
  };
}

/**
 * Initialize the ratchet as the X3DH responder (Bob).
 * Bob uses his signed pre-key pair as the first ratchet key.
 */
export function initializeReceiver(
  sharedSecret: Uint8Array,
  ourRatchetKeyPair: { publicKey: Uint8Array; privateKey: Uint8Array },
): RatchetState {
  return {
    rootKey: sharedSecret,
    sendingChainKey: null,
    receivingChainKey: null,
    dhSendingKeyPair: ourRatchetKeyPair,
    dhReceivingPublicKey: null,
    sendingChainLength: 0,
    receivingChainLength: 0,
    previousSendingChainLength: 0,
    skippedMessageKeys: [],
  };
}

/**
 * Encrypt a plaintext message using the Double Ratchet.
 * Advances the sending chain by one step.
 */
export async function ratchetEncrypt(
  backend: CryptoBackend,
  state: RatchetState,
  plaintext: string,
): Promise<{ state: RatchetState; encrypted: EncryptedMessage }> {
  if (!state.sendingChainKey) {
    throw new Error("Sending chain not initialized — receive a message first");
  }

  // Advance the sending chain
  const { nextChainKey, messageKey } = await kdfChainStep(backend, state.sendingChainKey);

  // Build header
  const header: MessageHeader = {
    ratchetPublicKey: toBase64(state.dhSendingKeyPair.publicKey),
    messageNumber: state.sendingChainLength,
    previousChainLength: state.previousSendingChainLength,
  };

  // Encode header as AAD for authenticated encryption
  const aad = encodeHeaderAsAad(
    header.ratchetPublicKey,
    header.messageNumber,
    header.previousChainLength,
  );

  // Encrypt the plaintext
  const plaintextBytes = new TextEncoder().encode(plaintext);
  const { ciphertext, iv } = await encrypt(backend, messageKey, plaintextBytes, aad);

  const newState: RatchetState = {
    ...state,
    sendingChainKey: nextChainKey,
    sendingChainLength: state.sendingChainLength + 1,
  };

  return {
    state: newState,
    encrypted: {
      header,
      ciphertext: toBase64(ciphertext),
      iv: toBase64(iv),
    },
  };
}

/**
 * Decrypt a message using the Double Ratchet.
 * Handles DH ratchet steps and out-of-order messages.
 */
export async function ratchetDecrypt(
  backend: CryptoBackend,
  state: RatchetState,
  encrypted: EncryptedMessage,
): Promise<{ state: RatchetState; plaintext: string }> {
  const { header } = encrypted;
  const theirRatchetPublicKey = fromBase64(header.ratchetPublicKey);

  // Check if we have a skipped message key for this
  const skippedResult = await trySkippedMessageKeys(backend, state, encrypted);
  if (skippedResult) {
    return skippedResult;
  }

  let newState = { ...state, skippedMessageKeys: [...state.skippedMessageKeys] };

  // Check if we need a DH ratchet step (new ratchet public key from sender)
  const currentReceivingKey = state.dhReceivingPublicKey;
  const needsDhStep =
    !currentReceivingKey || toBase64(currentReceivingKey) !== header.ratchetPublicKey;

  if (needsDhStep) {
    // Skip any remaining messages in the current receiving chain
    if (newState.receivingChainKey) {
      newState = await skipMessageKeys(backend, newState, header.previousChainLength);
    }

    // Perform DH ratchet step
    newState = await dhRatchetStep(backend, newState, theirRatchetPublicKey);
  }

  // Skip ahead to the correct message number in the receiving chain
  newState = await skipMessageKeys(backend, newState, header.messageNumber);

  // Advance the receiving chain one more step for this message
  if (!newState.receivingChainKey) {
    throw new Error("Receiving chain not initialized");
  }
  const { nextChainKey, messageKey } = await kdfChainStep(backend, newState.receivingChainKey);

  // Decrypt
  const aad = encodeHeaderAsAad(
    header.ratchetPublicKey,
    header.messageNumber,
    header.previousChainLength,
  );
  const ciphertext = fromBase64(encrypted.ciphertext);
  const iv = fromBase64(encrypted.iv);
  const plaintextBytes = await decrypt(backend, messageKey, ciphertext, iv, aad);

  newState = {
    ...newState,
    receivingChainKey: nextChainKey,
    receivingChainLength: newState.receivingChainLength + 1,
  };

  return {
    state: newState,
    plaintext: new TextDecoder().decode(plaintextBytes),
  };
}

/** Try to decrypt using a previously skipped message key */
async function trySkippedMessageKeys(
  backend: CryptoBackend,
  state: RatchetState,
  encrypted: EncryptedMessage,
): Promise<{ state: RatchetState; plaintext: string } | null> {
  const { header } = encrypted;
  const idx = state.skippedMessageKeys.findIndex(
    (entry) =>
      entry.ratchetPublicKey === header.ratchetPublicKey &&
      entry.messageNumber === header.messageNumber,
  );

  if (idx === -1) return null;

  const messageKey = state.skippedMessageKeys[idx].messageKey;

  // Remove the used skipped key
  const newSkipped = [...state.skippedMessageKeys];
  newSkipped.splice(idx, 1);

  // Decrypt with the skipped key
  const aad = encodeHeaderAsAad(
    header.ratchetPublicKey,
    header.messageNumber,
    header.previousChainLength,
  );
  const ciphertext = fromBase64(encrypted.ciphertext);
  const iv = fromBase64(encrypted.iv);
  const plaintextBytes = await decrypt(backend, messageKey, ciphertext, iv, aad);

  return {
    state: { ...state, skippedMessageKeys: newSkipped },
    plaintext: new TextDecoder().decode(plaintextBytes),
  };
}

/** Skip message keys up to (but not including) the target message number */
async function skipMessageKeys(
  backend: CryptoBackend,
  state: RatchetState,
  targetNumber: number,
): Promise<RatchetState> {
  if (!state.receivingChainKey) return state;

  const toSkip = targetNumber - state.receivingChainLength;
  if (toSkip < 0) return state;
  if (toSkip > MAX_SKIP_MESSAGE_KEYS) {
    throw new Error(
      `Too many skipped messages: ${toSkip} exceeds limit of ${MAX_SKIP_MESSAGE_KEYS}`,
    );
  }

  let chainKey = state.receivingChainKey;
  const newSkipped = [...state.skippedMessageKeys];
  const currentDhPub = state.dhReceivingPublicKey ? toBase64(state.dhReceivingPublicKey) : "";
  let chainLength = state.receivingChainLength;

  for (let i = 0; i < toSkip; i++) {
    const { nextChainKey, messageKey } = await kdfChainStep(backend, chainKey);
    newSkipped.push({
      ratchetPublicKey: currentDhPub,
      messageNumber: chainLength,
      messageKey,
    });
    chainKey = nextChainKey;
    chainLength++;

    // Enforce max skipped keys by removing oldest
    if (newSkipped.length > MAX_SKIP_MESSAGE_KEYS) {
      newSkipped.shift();
    }
  }

  return {
    ...state,
    receivingChainKey: chainKey,
    receivingChainLength: chainLength,
    skippedMessageKeys: newSkipped,
  };
}

/** Perform a DH ratchet step when receiving a new ratchet public key */
async function dhRatchetStep(
  backend: CryptoBackend,
  state: RatchetState,
  theirNewRatchetPublicKey: Uint8Array,
): Promise<RatchetState> {
  // Derive receiving chain from DH(ourCurrent, theirNew)
  const dhReceive = backend.x25519(state.dhSendingKeyPair.privateKey, theirNewRatchetPublicKey);
  const { newRootKey: rootKey1, chainKey: receivingChainKey } = await kdfRootStep(
    backend,
    state.rootKey,
    dhReceive,
  );

  // Generate new DH key pair and derive sending chain
  const newDhKeyPair = backend.generateX25519KeyPair();
  const dhSend = backend.x25519(newDhKeyPair.privateKey, theirNewRatchetPublicKey);
  const { newRootKey: rootKey2, chainKey: sendingChainKey } = await kdfRootStep(
    backend,
    rootKey1,
    dhSend,
  );

  return {
    ...state,
    rootKey: rootKey2,
    sendingChainKey,
    receivingChainKey,
    dhSendingKeyPair: newDhKeyPair,
    dhReceivingPublicKey: theirNewRatchetPublicKey,
    previousSendingChainLength: state.sendingChainLength,
    sendingChainLength: 0,
    receivingChainLength: 0,
  };
}

// ── Serialization ──

/** Serialize a RatchetState for storage (IndexedDB/SQLite) */
export function serializeRatchetState(state: RatchetState): SerializedRatchetState {
  return {
    rootKey: toBase64(state.rootKey),
    sendingChainKey: state.sendingChainKey ? toBase64(state.sendingChainKey) : null,
    receivingChainKey: state.receivingChainKey ? toBase64(state.receivingChainKey) : null,
    dhSendingKeyPair: {
      publicKey: toBase64(state.dhSendingKeyPair.publicKey),
      privateKey: toBase64(state.dhSendingKeyPair.privateKey),
    },
    dhReceivingPublicKey: state.dhReceivingPublicKey ? toBase64(state.dhReceivingPublicKey) : null,
    sendingChainLength: state.sendingChainLength,
    receivingChainLength: state.receivingChainLength,
    previousSendingChainLength: state.previousSendingChainLength,
    skippedMessageKeys: state.skippedMessageKeys.map(
      (entry): SerializedSkippedKeyEntry => ({
        ratchetPublicKey: entry.ratchetPublicKey,
        messageNumber: entry.messageNumber,
        messageKey: toBase64(entry.messageKey),
      }),
    ),
  };
}

/** Deserialize a RatchetState from storage */
export function deserializeRatchetState(data: SerializedRatchetState): RatchetState {
  return {
    rootKey: fromBase64(data.rootKey),
    sendingChainKey: data.sendingChainKey ? fromBase64(data.sendingChainKey) : null,
    receivingChainKey: data.receivingChainKey ? fromBase64(data.receivingChainKey) : null,
    dhSendingKeyPair: {
      publicKey: fromBase64(data.dhSendingKeyPair.publicKey),
      privateKey: fromBase64(data.dhSendingKeyPair.privateKey),
    },
    dhReceivingPublicKey: data.dhReceivingPublicKey ? fromBase64(data.dhReceivingPublicKey) : null,
    sendingChainLength: data.sendingChainLength,
    receivingChainLength: data.receivingChainLength,
    previousSendingChainLength: data.previousSendingChainLength,
    skippedMessageKeys: data.skippedMessageKeys.map(
      (entry): SkippedKeyEntry => ({
        ratchetPublicKey: entry.ratchetPublicKey,
        messageNumber: entry.messageNumber,
        messageKey: fromBase64(entry.messageKey),
      }),
    ),
  };
}
