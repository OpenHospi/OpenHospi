import { getCryptoProvider } from "../primitives/CryptoProvider";

import { utf8ToBytes, toBase64, fromBase64 } from "./encoding";
import type {
  SenderKeyState,
  SenderKeyDistributionMessage,
  GroupCiphertextPayload,
  SerializedSenderKeyState,
} from "./types";

const MAX_FORWARD_JUMPS = 2000;

export class StaleSenderKeyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StaleSenderKeyError";
  }
}

// ── Key Generation ──

export function generateSenderKey(): SenderKeyState {
  const crypto = getCryptoProvider();
  const chainKey = crypto.randomBytes(32);
  const signatureKeyPair = crypto.ed25519GenerateKeyPair();
  const senderKeyId =
    ((crypto.randomBytes(4)[0]! << 24) |
      (crypto.randomBytes(4)[1]! << 16) |
      (crypto.randomBytes(4)[2]! << 8) |
      crypto.randomBytes(4)[3]!) >>>
    0;

  return {
    senderKeyId,
    chainKey,
    signatureKeyPair,
    iteration: 0,
  };
}

// ── Distribution Messages ──

export function createDistributionMessage(state: SenderKeyState): SenderKeyDistributionMessage {
  return {
    senderKeyId: state.senderKeyId,
    iteration: state.iteration,
    chainKey: new Uint8Array(state.chainKey),
    signingPublicKey: new Uint8Array(state.signatureKeyPair.publicKey),
  };
}

export function processDistributionMessage(
  distribution: SenderKeyDistributionMessage,
): SenderKeyState {
  return {
    senderKeyId: distribution.senderKeyId,
    chainKey: new Uint8Array(distribution.chainKey),
    signatureKeyPair: {
      publicKey: new Uint8Array(distribution.signingPublicKey),
      privateKey: new Uint8Array(0), // recipients only have the public key
    },
    iteration: distribution.iteration,
  };
}

// ── Chain Ratchet ──

async function chainStep(
  chainKey: Uint8Array,
): Promise<{ messageKey: Uint8Array; nextChainKey: Uint8Array }> {
  const crypto = getCryptoProvider();
  const messageKey = await crypto.hmacSha256(chainKey, new Uint8Array([0x01]));
  const nextChainKey = await crypto.hmacSha256(chainKey, new Uint8Array([0x02]));
  return { messageKey, nextChainKey };
}

async function fastForward(
  chainKey: Uint8Array,
  steps: number,
): Promise<{ messageKey: Uint8Array; chainKey: Uint8Array }> {
  let current = chainKey;
  let messageKey: Uint8Array = new Uint8Array(32);
  for (let i = 0; i < steps; i++) {
    const result = await chainStep(current);
    messageKey = result.messageKey;
    current = result.nextChainKey;
  }
  return { messageKey, chainKey: current };
}

// ── Encryption ──

export async function senderKeyEncrypt(
  state: SenderKeyState,
  plaintext: Uint8Array,
  conversationId: string,
  senderUserId: string,
): Promise<{ payload: GroupCiphertextPayload; updatedState: SenderKeyState }> {
  const crypto = getCryptoProvider();

  const { messageKey, nextChainKey } = await chainStep(state.chainKey);

  // Derive enc key + IV from message key
  const derived = await crypto.hkdf(
    messageKey,
    new Uint8Array(32),
    utf8ToBytes("WhisperGroup"),
    48, // 32 enc key + 16 IV
  );
  const encKey = derived.slice(0, 32);
  const iv = derived.slice(32, 48);

  // AAD binds ciphertext to conversation context
  const aad = utf8ToBytes(
    `${conversationId}:${senderUserId}:${state.iteration}:${state.senderKeyId}`,
  );

  const ciphertext = await crypto.aesGcmEncrypt(encKey, plaintext, iv, aad);

  // Sign the ciphertext for authentication
  const signature = crypto.ed25519Sign(state.signatureKeyPair.privateKey, ciphertext);

  const payload: GroupCiphertextPayload = {
    senderKeyId: state.senderKeyId,
    iteration: state.iteration,
    ciphertext,
    signature,
  };

  const updatedState: SenderKeyState = {
    ...state,
    chainKey: nextChainKey,
    iteration: state.iteration + 1,
  };

  return { payload, updatedState };
}

// ── Decryption ──

export async function senderKeyDecrypt(
  state: SenderKeyState,
  payload: GroupCiphertextPayload,
  conversationId: string,
  senderUserId: string,
): Promise<{ plaintext: Uint8Array; updatedState: SenderKeyState }> {
  const crypto = getCryptoProvider();

  if (payload.senderKeyId !== state.senderKeyId) {
    throw new StaleSenderKeyError(
      `Sender key ID mismatch: expected ${state.senderKeyId}, got ${payload.senderKeyId}`,
    );
  }

  // Verify signature
  const isValid = crypto.ed25519Verify(
    state.signatureKeyPair.publicKey,
    payload.ciphertext,
    payload.signature,
  );
  if (!isValid) {
    throw new Error("Sender key signature verification failed");
  }

  // Calculate steps needed
  const stepsNeeded = payload.iteration - state.iteration;
  if (stepsNeeded < 0) {
    throw new Error(
      "Message iteration is behind current state (replay or out-of-order not yet decryptable)",
    );
  }
  if (stepsNeeded > MAX_FORWARD_JUMPS) {
    throw new StaleSenderKeyError(
      `Too many skipped iterations (${stepsNeeded}), maximum is ${MAX_FORWARD_JUMPS}. Request sender key re-distribution.`,
    );
  }

  // Fast forward chain to the correct iteration
  let messageKey: Uint8Array;
  let newChainKey: Uint8Array;

  if (stepsNeeded === 0) {
    const result = await chainStep(state.chainKey);
    messageKey = result.messageKey;
    newChainKey = result.nextChainKey;
  } else {
    // Need to skip some iterations
    const ffResult = await fastForward(state.chainKey, stepsNeeded);
    // Now do one more step for the current message
    const result = await chainStep(ffResult.chainKey);
    messageKey = result.messageKey;
    newChainKey = result.nextChainKey;
  }

  // Derive enc key + IV
  const derived = await crypto.hkdf(
    messageKey,
    new Uint8Array(32),
    utf8ToBytes("WhisperGroup"),
    48,
  );
  const encKey = derived.slice(0, 32);
  const iv = derived.slice(32, 48);

  // AAD
  const aad = utf8ToBytes(
    `${conversationId}:${senderUserId}:${payload.iteration}:${payload.senderKeyId}`,
  );

  const plaintext = await crypto.aesGcmDecrypt(encKey, payload.ciphertext, iv, aad);

  const updatedState: SenderKeyState = {
    ...state,
    chainKey: newChainKey,
    iteration: payload.iteration + 1,
  };

  return { plaintext, updatedState };
}

// ── Serialization ──

export function serializeSenderKeyState(state: SenderKeyState): SerializedSenderKeyState {
  return {
    senderKeyId: state.senderKeyId,
    chainKey: toBase64(state.chainKey),
    signatureKeyPair: {
      publicKey: toBase64(state.signatureKeyPair.publicKey),
      privateKey: toBase64(state.signatureKeyPair.privateKey),
    },
    iteration: state.iteration,
  };
}

export function deserializeSenderKeyState(data: SerializedSenderKeyState): SenderKeyState {
  return {
    senderKeyId: data.senderKeyId,
    chainKey: fromBase64(data.chainKey),
    signatureKeyPair: {
      publicKey: fromBase64(data.signatureKeyPair.publicKey),
      privateKey: fromBase64(data.signatureKeyPair.privateKey),
    },
    iteration: data.iteration,
  };
}

// ── Distribution Message Serialization ──

export function serializeDistributionMessage(msg: SenderKeyDistributionMessage): string {
  return JSON.stringify({
    senderKeyId: msg.senderKeyId,
    iteration: msg.iteration,
    chainKey: toBase64(msg.chainKey),
    signingPublicKey: toBase64(msg.signingPublicKey),
  });
}

export function deserializeDistributionMessage(json: string): SenderKeyDistributionMessage {
  const data = JSON.parse(json) as {
    senderKeyId: number;
    iteration: number;
    chainKey: string;
    signingPublicKey: string;
  };
  return {
    senderKeyId: data.senderKeyId,
    iteration: data.iteration,
    chainKey: fromBase64(data.chainKey),
    signingPublicKey: fromBase64(data.signingPublicKey),
  };
}
