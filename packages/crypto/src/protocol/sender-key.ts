/**
 * Signal Sender Keys — full lifecycle: generate, encrypt, decrypt, serialize.
 *
 * Each user generates one Sender Key per conversation. Messages are encrypted
 * with a symmetric HMAC chain ratchet (one ciphertext for all recipients)
 * and signed with Ed25519 for authentication.
 */
import type { CryptoBackend } from "../backends/platform";

import { fromBase64, toBase64 } from "./encoding";
import { decrypt, encrypt, encodeGroupAad, encodeSignatureData } from "./encryption";
import { fastForwardChain, senderKeyChainStep } from "./sender-key-chain";
import type { GroupCiphertextPayload, SenderKeyState, SerializedSenderKeyState } from "./types";

/**
 * Generate a fresh Sender Key for a conversation.
 * The signing key pair is Ed25519 — used to authenticate each ciphertext.
 */
export function generateSenderKey(backend: CryptoBackend): SenderKeyState {
  return {
    chainKey: backend.randomBytes(32),
    signingKeyPair: backend.generateEd25519KeyPair(),
    iteration: 0,
    skippedMessageKeys: new Map(),
  };
}

/**
 * Encrypt plaintext using the Sender Key chain.
 *
 * 1. Advance chain → derive messageKey
 * 2. Encrypt with AES-256-GCM using AAD = "${conversationId}|${senderUserId}|${iteration}"
 * 3. Sign (ciphertext || iv || iteration) with Ed25519
 */
export async function senderKeyEncrypt(
  backend: CryptoBackend,
  state: SenderKeyState,
  plaintext: string,
  conversationId: string,
  senderUserId: string,
): Promise<{ state: SenderKeyState; payload: GroupCiphertextPayload }> {
  const currentIteration = state.iteration;

  // Advance chain
  const { nextChainKey, messageKey } = await senderKeyChainStep(backend, state.chainKey);

  // Encrypt with AAD binding to conversation + sender + iteration
  const aad = encodeGroupAad(conversationId, senderUserId, currentIteration);
  const { ciphertext, iv } = await encrypt(
    backend,
    messageKey,
    new TextEncoder().encode(plaintext),
    aad,
  );

  // Sign for authentication
  const signData = encodeSignatureData(toBase64(ciphertext), toBase64(iv), currentIteration);
  const signature = backend.ed25519Sign(state.signingKeyPair.privateKey, signData);

  const payload: GroupCiphertextPayload = {
    ciphertext: toBase64(ciphertext),
    iv: toBase64(iv),
    signature: toBase64(signature),
    chainIteration: currentIteration,
  };

  const newState: SenderKeyState = {
    ...state,
    chainKey: nextChainKey,
    iteration: currentIteration + 1,
  };

  return { state: newState, payload };
}

/**
 * Decrypt a group message using the sender's Sender Key.
 *
 * 1. Fast-forward chain to payload.chainIteration (caching skipped keys)
 * 2. Verify Ed25519 signature
 * 3. Decrypt with AES-256-GCM + AAD
 */
export async function senderKeyDecrypt(
  backend: CryptoBackend,
  state: SenderKeyState,
  payload: GroupCiphertextPayload,
  signingPublicKey: Uint8Array,
  conversationId: string,
  senderUserId: string,
): Promise<{ state: SenderKeyState; plaintext: string }> {
  // Verify signature first
  const signData = encodeSignatureData(payload.ciphertext, payload.iv, payload.chainIteration);
  const sigValid = backend.ed25519Verify(signingPublicKey, signData, fromBase64(payload.signature));
  if (!sigValid) {
    throw new Error("Sender Key: Ed25519 signature verification failed");
  }

  let messageKey: Uint8Array;
  let newState: SenderKeyState;

  // Check if we have a cached skipped key for this iteration
  const cachedKey = state.skippedMessageKeys.get(payload.chainIteration);
  if (cachedKey) {
    messageKey = cachedKey;
    const newSkipped = new Map(state.skippedMessageKeys);
    newSkipped.delete(payload.chainIteration);
    newState = { ...state, skippedMessageKeys: newSkipped };
  } else if (payload.chainIteration >= state.iteration) {
    // Fast-forward chain to target iteration
    const result = await fastForwardChain(
      backend,
      state.chainKey,
      state.iteration,
      payload.chainIteration,
    );

    // Merge skipped keys
    const newSkipped = new Map(state.skippedMessageKeys);
    for (const [iter, key] of result.skippedKeys) {
      newSkipped.set(iter, key);
    }

    messageKey = result.messageKey;
    newState = {
      ...state,
      chainKey: result.chainKey,
      iteration: payload.chainIteration + 1,
      skippedMessageKeys: newSkipped,
    };
  } else {
    throw new Error(
      `Sender Key: message iteration ${payload.chainIteration} < current ${state.iteration} and no cached key`,
    );
  }

  // Decrypt
  const aad = encodeGroupAad(conversationId, senderUserId, payload.chainIteration);
  const plainBytes = await decrypt(
    backend,
    messageKey,
    fromBase64(payload.ciphertext),
    fromBase64(payload.iv),
    aad,
  );

  return { state: newState, plaintext: new TextDecoder().decode(plainBytes) };
}

/** Serialize SenderKeyState for storage (IndexedDB / SecureStorage) */
export function serializeSenderKeyState(state: SenderKeyState): SerializedSenderKeyState {
  return {
    chainKey: toBase64(state.chainKey),
    signingPublicKey: toBase64(state.signingKeyPair.publicKey),
    signingPrivateKey: toBase64(state.signingKeyPair.privateKey),
    iteration: state.iteration,
    skippedMessageKeys: Array.from(state.skippedMessageKeys.entries()).map(([iter, key]) => ({
      iteration: iter,
      messageKey: toBase64(key),
    })),
  };
}

/** Deserialize SenderKeyState from storage */
export function deserializeSenderKeyState(data: SerializedSenderKeyState): SenderKeyState {
  const skippedMessageKeys = new Map<number, Uint8Array>();
  for (const entry of data.skippedMessageKeys) {
    skippedMessageKeys.set(entry.iteration, fromBase64(entry.messageKey));
  }

  return {
    chainKey: fromBase64(data.chainKey),
    signingKeyPair: {
      publicKey: fromBase64(data.signingPublicKey),
      privateKey: data.signingPrivateKey ? fromBase64(data.signingPrivateKey) : new Uint8Array(0),
    },
    iteration: data.iteration,
    skippedMessageKeys,
  };
}
