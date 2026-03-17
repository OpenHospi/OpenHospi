import { getCryptoProvider } from "../primitives/CryptoProvider";

import { concat, encodeUtf8 } from "./encoding";
import { ed25519Sign, ed25519Verify, generateEd25519KeyPair } from "./keys";
import type {
  SenderKeyDistributionMessage,
  SenderKeyMessageData,
  SenderKeyRecord,
  SenderKeyState,
} from "./types";

const CHAIN_KEY_SEED = new Uint8Array([0x02]);
const MESSAGE_KEY_SEED = new Uint8Array([0x01]);

/** Generate a new Sender Key state for a group conversation. */
export function generateSenderKeyState(distributionId: string): SenderKeyState {
  const provider = getCryptoProvider();
  return {
    chainKey: provider.randomBytes(32),
    iteration: 0,
    signingKeyPair: generateEd25519KeyPair(),
  };
}

/** Create a distribution message from the current sender key state. */
export function createDistributionMessage(
  distributionId: string,
  state: SenderKeyState,
): SenderKeyDistributionMessage {
  return {
    distributionId,
    chainKey: state.chainKey,
    iteration: state.iteration,
    signingKey: state.signingKeyPair.publicKey,
  };
}

/** Serialize a SenderKeyDistributionMessage to bytes. */
export function serializeDistributionMessage(msg: SenderKeyDistributionMessage): Uint8Array {
  const distIdBytes = encodeUtf8(msg.distributionId);
  const provider = getCryptoProvider();

  // Format: distIdLen(2) + distId + chainKey(32) + iteration(4) + signingKey(32)
  const len = new Uint8Array(2);
  len[0] = (distIdBytes.length >> 8) & 0xff;
  len[1] = distIdBytes.length & 0xff;

  const iterBytes = new Uint8Array(4);
  iterBytes[0] = (msg.iteration >>> 24) & 0xff;
  iterBytes[1] = (msg.iteration >>> 16) & 0xff;
  iterBytes[2] = (msg.iteration >>> 8) & 0xff;
  iterBytes[3] = msg.iteration & 0xff;

  return concat(len, distIdBytes, msg.chainKey, iterBytes, msg.signingKey);
}

/** Deserialize a SenderKeyDistributionMessage from bytes. */
export function deserializeDistributionMessage(data: Uint8Array): SenderKeyDistributionMessage {
  const distIdLen = (data[0] << 8) | data[1];
  const distIdBytes = data.slice(2, 2 + distIdLen);
  const distributionId = new TextDecoder().decode(distIdBytes);

  let offset = 2 + distIdLen;
  const chainKey = data.slice(offset, offset + 32);
  offset += 32;

  const iteration =
    ((data[offset] << 24) |
      (data[offset + 1] << 16) |
      (data[offset + 2] << 8) |
      data[offset + 3]) >>>
    0;
  offset += 4;

  const signingKey = data.slice(offset, offset + 32);

  return { distributionId, chainKey, iteration, signingKey };
}

/** Advance the chain key for one iteration, returning the message key. */
function deriveMessageKeyFromChain(chainKey: Uint8Array): {
  messageKey: Uint8Array;
  nextChainKey: Uint8Array;
} {
  const provider = getCryptoProvider();
  return {
    messageKey: provider.hmacSha256(chainKey, MESSAGE_KEY_SEED),
    nextChainKey: provider.hmacSha256(chainKey, CHAIN_KEY_SEED),
  };
}

/**
 * Encrypt a message using the Sender Key.
 * Returns the updated state and the encrypted message data.
 */
export function senderKeyEncrypt(
  distributionId: string,
  state: SenderKeyState,
  plaintext: Uint8Array,
): { state: SenderKeyState; message: SenderKeyMessageData } {
  const provider = getCryptoProvider();
  const { messageKey, nextChainKey } = deriveMessageKeyFromChain(state.chainKey);

  // Derive AES key + IV from message key
  const derived = provider.hkdf(messageKey, new Uint8Array(32), encodeUtf8("WhisperGroup"), 48);
  const aesKey = derived.slice(0, 32);
  const iv = derived.slice(32, 48);

  const ciphertext = provider.aesCbcEncrypt(aesKey, iv, plaintext);

  // Sign the ciphertext
  const signature = ed25519Sign(state.signingKeyPair.privateKey, ciphertext);

  const message: SenderKeyMessageData = {
    distributionId,
    chainId: state.iteration,
    ciphertext,
    signature,
  };

  return {
    state: {
      ...state,
      chainKey: nextChainKey,
      iteration: state.iteration + 1,
    },
    message,
  };
}

/**
 * Decrypt a message using a received Sender Key.
 * The receiver must have the sender's key state (from a distribution message).
 */
export function senderKeyDecrypt(
  state: SenderKeyState,
  message: SenderKeyMessageData,
): { state: SenderKeyState; plaintext: Uint8Array } {
  const provider = getCryptoProvider();

  // Verify signature
  if (!ed25519Verify(state.signingKeyPair.publicKey, message.ciphertext, message.signature)) {
    throw new Error("Sender key message signature verification failed");
  }

  // Fast-forward chain to the right iteration
  let currentChainKey = state.chainKey;
  let currentIteration = state.iteration;

  if (message.chainId < currentIteration) {
    throw new Error("Sender key message is from a past iteration (replay attack?)");
  }

  const MAX_FORWARD_SKIP = 2000;
  if (message.chainId - currentIteration > MAX_FORWARD_SKIP) {
    throw new Error("Too many skipped sender key iterations");
  }

  // Advance chain to target iteration
  while (currentIteration < message.chainId) {
    const { nextChainKey } = deriveMessageKeyFromChain(currentChainKey);
    currentChainKey = nextChainKey;
    currentIteration++;
  }

  // Derive message key at the target iteration
  const { messageKey, nextChainKey } = deriveMessageKeyFromChain(currentChainKey);

  // Derive AES key + IV
  const derived = provider.hkdf(messageKey, new Uint8Array(32), encodeUtf8("WhisperGroup"), 48);
  const aesKey = derived.slice(0, 32);
  const iv = derived.slice(32, 48);

  const plaintext = provider.aesCbcDecrypt(aesKey, iv, message.ciphertext);

  return {
    state: {
      ...state,
      chainKey: nextChainKey,
      iteration: currentIteration + 1,
    },
    plaintext,
  };
}
