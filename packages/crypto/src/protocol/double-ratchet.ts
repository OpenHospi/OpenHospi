import { getCryptoProvider } from "../primitives/CryptoProvider";

import { concat, encodeUtf8, timingSafeEqual } from "./encoding";
import { generateX25519KeyPair, x25519Dh } from "./keys";
import type { KeyPair, SessionState, WhisperMessage } from "./types";

const MAX_SKIP = 1000;
const RATCHET_INFO = encodeUtf8("WhisperRatchet");
const CHAIN_KEY_SEED = new Uint8Array([0x02]);
const MESSAGE_KEY_SEED = new Uint8Array([0x01]);

/** Derive the next chain key from the current chain key. */
function advanceChainKey(chainKey: Uint8Array): Uint8Array {
  return getCryptoProvider().hmacSha256(chainKey, CHAIN_KEY_SEED);
}

/** Derive a message key from the current chain key. */
function deriveMessageKey(chainKey: Uint8Array): Uint8Array {
  return getCryptoProvider().hmacSha256(chainKey, MESSAGE_KEY_SEED);
}

/** Perform a DH ratchet step: derive new root key and chain key. */
function kdfRootKey(
  rootKey: Uint8Array,
  dhOutput: Uint8Array,
): { rootKey: Uint8Array; chainKey: Uint8Array } {
  const provider = getCryptoProvider();
  const derived = provider.hkdf(dhOutput, rootKey, RATCHET_INFO, 64);
  return {
    rootKey: derived.slice(0, 32),
    chainKey: derived.slice(32, 64),
  };
}

/** Build the key for skipped-message lookup. */
function skippedKeyId(ratchetKey: Uint8Array, counter: number): string {
  const keyHex = Array.from(ratchetKey)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${keyHex}:${counter}`;
}

/**
 * Encrypt a plaintext message using the Double Ratchet algorithm.
 * Returns the updated session state and the wire message.
 */
export function ratchetEncrypt(
  state: SessionState,
  plaintext: Uint8Array,
): { state: SessionState; message: WhisperMessage } {
  const provider = getCryptoProvider();

  if (!state.sendingChainKey || !state.sendingRatchetKey) {
    throw new Error("Session not initialized for sending");
  }

  // Derive message key from sending chain
  const messageKey = deriveMessageKey(state.sendingChainKey);
  const nextChainKey = advanceChainKey(state.sendingChainKey);

  // Encrypt: first 32 bytes = AES key, next 16 bytes = IV from message key derivation
  const encKeys = provider.hkdf(
    messageKey,
    new Uint8Array(32),
    encodeUtf8("WhisperMessageKeys"),
    80,
  );
  const aesKey = encKeys.slice(0, 32);
  const hmacKey = encKeys.slice(32, 64);
  const iv = encKeys.slice(64, 80);

  const ciphertext = provider.aesCbcEncrypt(aesKey, iv, plaintext);

  // HMAC covers identity keys + ratchet key + counters + ciphertext (Signal spec compliant)
  const counterBytes = new Uint8Array(8);
  new DataView(counterBytes.buffer).setUint32(0, state.sendingCounter);
  new DataView(counterBytes.buffer).setUint32(4, state.previousSendingCounter);
  const macInput = concat(
    state.localIdentityKey,
    state.remoteIdentityKey,
    state.sendingRatchetKey.publicKey,
    counterBytes,
    ciphertext,
  );
  const mac = provider.hmacSha256(hmacKey, macInput).slice(0, 8);

  const message: WhisperMessage = {
    ratchetKey: state.sendingRatchetKey.publicKey,
    counter: state.sendingCounter,
    previousCounter: state.previousSendingCounter,
    ciphertext: concat(ciphertext, mac),
  };

  return {
    state: {
      ...state,
      sendingChainKey: nextChainKey,
      sendingCounter: state.sendingCounter + 1,
    },
    message,
  };
}

/**
 * Decrypt a message using the Double Ratchet algorithm.
 * Returns the updated session state and the plaintext.
 */
export function ratchetDecrypt(
  state: SessionState,
  message: WhisperMessage,
): { state: SessionState; plaintext: Uint8Array } {
  // Check if this is a skipped message
  const skipId = skippedKeyId(message.ratchetKey, message.counter);
  const skippedKey = state.skippedKeys.get(skipId);

  if (skippedKey) {
    const newSkipped = new Map(state.skippedKeys);
    newSkipped.delete(skipId);
    const plaintext = decryptWithMessageKey(
      skippedKey,
      message,
      state.remoteIdentityKey,
      state.localIdentityKey,
    );
    return { state: { ...state, skippedKeys: newSkipped }, plaintext };
  }

  let currentState = { ...state, skippedKeys: new Map(state.skippedKeys) };

  // If ratchet key changed, do a DH ratchet step
  if (
    !currentState.receivingRatchetKey ||
    !arraysEqual(message.ratchetKey, currentState.receivingRatchetKey)
  ) {
    // Skip any missed messages from the old chain
    if (currentState.receivingChainKey && currentState.receivingRatchetKey) {
      currentState = skipMessages(
        currentState,
        currentState.receivingRatchetKey,
        currentState.receivingChainKey,
        message.previousCounter,
      );
    }

    // Perform DH ratchet step
    currentState = dhRatchetStep(currentState, message.ratchetKey);
  }

  // Skip any missed messages in the current chain
  if (!currentState.receivingChainKey) {
    throw new Error("No receiving chain key available");
  }
  currentState = skipMessages(
    currentState,
    message.ratchetKey,
    currentState.receivingChainKey,
    message.counter,
  );

  // Derive message key and decrypt
  const messageKey = deriveMessageKey(currentState.receivingChainKey!);
  currentState = {
    ...currentState,
    receivingChainKey: advanceChainKey(currentState.receivingChainKey!),
    receivingCounter: currentState.receivingCounter + 1,
  };

  const plaintext = decryptWithMessageKey(
    messageKey,
    message,
    currentState.remoteIdentityKey,
    currentState.localIdentityKey,
  );
  return { state: currentState, plaintext };
}

function dhRatchetStep(state: SessionState, remoteRatchetKey: Uint8Array): SessionState {
  // Derive receiving chain
  const dhReceive = x25519Dh(state.sendingRatchetKey!.privateKey, remoteRatchetKey);
  const { rootKey: rootKey1, chainKey: receivingChainKey } = kdfRootKey(state.rootKey, dhReceive);

  // Generate new sending ratchet key pair
  const newSendingRatchetKey = generateX25519KeyPair();
  const dhSend = x25519Dh(newSendingRatchetKey.privateKey, remoteRatchetKey);
  const { rootKey: rootKey2, chainKey: sendingChainKey } = kdfRootKey(rootKey1, dhSend);

  return {
    ...state,
    rootKey: rootKey2,
    sendingChainKey: sendingChainKey,
    receivingChainKey: receivingChainKey,
    sendingRatchetKey: newSendingRatchetKey,
    receivingRatchetKey: remoteRatchetKey,
    previousSendingCounter: state.sendingCounter,
    sendingCounter: 0,
    receivingCounter: 0,
  };
}

function skipMessages(
  state: SessionState,
  ratchetKey: Uint8Array,
  chainKey: Uint8Array,
  until: number,
): SessionState {
  if (until - state.receivingCounter > MAX_SKIP) {
    throw new Error("Too many skipped messages");
  }

  const newSkipped = new Map(state.skippedKeys);
  let currentChainKey = chainKey;

  for (let i = state.receivingCounter; i < until; i++) {
    const msgKey = deriveMessageKey(currentChainKey);
    newSkipped.set(skippedKeyId(ratchetKey, i), msgKey);
    currentChainKey = advanceChainKey(currentChainKey);
  }

  return {
    ...state,
    receivingChainKey: currentChainKey,
    skippedKeys: newSkipped,
  };
}

function decryptWithMessageKey(
  messageKey: Uint8Array,
  message: WhisperMessage,
  senderIdentityKey: Uint8Array,
  receiverIdentityKey: Uint8Array,
): Uint8Array {
  const provider = getCryptoProvider();

  const encKeys = provider.hkdf(
    messageKey,
    new Uint8Array(32),
    encodeUtf8("WhisperMessageKeys"),
    80,
  );
  const aesKey = encKeys.slice(0, 32);
  const hmacKey = encKeys.slice(32, 64);
  const iv = encKeys.slice(64, 80);

  // Split ciphertext and MAC (last 8 bytes)
  const ciphertext = message.ciphertext.slice(0, -8);
  const receivedMac = message.ciphertext.slice(-8);

  // Verify MAC (must match sender's MAC which covered senderIdentity || receiverIdentity)
  const counterBytes = new Uint8Array(8);
  new DataView(counterBytes.buffer).setUint32(0, message.counter);
  new DataView(counterBytes.buffer).setUint32(4, message.previousCounter);
  const macInput = concat(
    senderIdentityKey,
    receiverIdentityKey,
    message.ratchetKey,
    counterBytes,
    ciphertext,
  );
  const expectedMac = provider.hmacSha256(hmacKey, macInput).slice(0, 8);

  if (!timingSafeEqual(receivedMac, expectedMac)) {
    throw new Error("Message authentication failed");
  }

  return provider.aesCbcDecrypt(aesKey, iv, ciphertext);
}

function arraysEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * Initialize a session state after X3DH as the initiator (Alice).
 */
export function initSessionAsInitiator(
  sharedSecret: Uint8Array,
  remoteIdentityKey: Uint8Array,
  localIdentityKey: Uint8Array,
  remoteSignedPreKey: Uint8Array,
): SessionState {
  // Alice derives the first sending chain
  const sendingRatchetKey = generateX25519KeyPair();
  const dhOutput = x25519Dh(sendingRatchetKey.privateKey, remoteSignedPreKey);
  const { rootKey, chainKey: sendingChainKey } = kdfRootKey(sharedSecret, dhOutput);

  return {
    rootKey,
    sendingChainKey,
    receivingChainKey: null,
    sendingRatchetKey,
    receivingRatchetKey: remoteSignedPreKey,
    sendingCounter: 0,
    receivingCounter: 0,
    previousSendingCounter: 0,
    skippedKeys: new Map(),
    remoteIdentityKey,
    localIdentityKey,
  };
}

/**
 * Initialize a session state after X3DH as the responder (Bob).
 */
export function initSessionAsResponder(
  sharedSecret: Uint8Array,
  remoteIdentityKey: Uint8Array,
  localIdentityKey: Uint8Array,
  localSignedPreKey: KeyPair,
): SessionState {
  return {
    rootKey: sharedSecret,
    sendingChainKey: null,
    receivingChainKey: null,
    sendingRatchetKey: localSignedPreKey,
    receivingRatchetKey: null,
    sendingCounter: 0,
    receivingCounter: 0,
    previousSendingCounter: 0,
    skippedKeys: new Map(),
    remoteIdentityKey,
    localIdentityKey,
  };
}
