/**
 * HMAC-based chain ratchet for Signal Sender Keys.
 *
 * Each step advances the chain by computing:
 *   nextChainKey = HMAC-SHA256(chainKey, 0x01)
 *   messageKey   = HMAC-SHA256(chainKey, 0x02)
 *
 * This provides forward secrecy within a Sender Key session:
 * compromising the current chain key does not reveal past message keys.
 */
import { MAX_SENDER_KEY_FORWARD_SKIP } from "@openhospi/shared/constants";

import type { CryptoBackend } from "../backends/platform";

const CHAIN_KEY_SEED = new Uint8Array([0x01]);
const MESSAGE_KEY_SEED = new Uint8Array([0x02]);

/**
 * Advance chain by one step: derive the next chain key and a message key.
 */
export async function senderKeyChainStep(
  backend: CryptoBackend,
  chainKey: Uint8Array,
): Promise<{ nextChainKey: Uint8Array; messageKey: Uint8Array }> {
  const [nextChainKey, messageKey] = await Promise.all([
    backend.hmacSha256(chainKey, CHAIN_KEY_SEED),
    backend.hmacSha256(chainKey, MESSAGE_KEY_SEED),
  ]);
  return { nextChainKey, messageKey };
}

/**
 * Fast-forward chain from currentIteration to targetIteration.
 *
 * Returns the message key for targetIteration plus all skipped keys
 * (for out-of-order message delivery).
 *
 * Throws if the gap exceeds MAX_SENDER_KEY_FORWARD_SKIP.
 */
export async function fastForwardChain(
  backend: CryptoBackend,
  chainKey: Uint8Array,
  currentIteration: number,
  targetIteration: number,
): Promise<{
  chainKey: Uint8Array;
  messageKey: Uint8Array;
  skippedKeys: Map<number, Uint8Array>;
}> {
  const gap = targetIteration - currentIteration;
  if (gap < 0) {
    throw new Error(
      `Cannot rewind chain: target iteration ${targetIteration} < current ${currentIteration}`,
    );
  }
  if (gap > MAX_SENDER_KEY_FORWARD_SKIP) {
    throw new Error(`Chain forward skip too large: ${gap} > ${MAX_SENDER_KEY_FORWARD_SKIP}`);
  }

  const skippedKeys = new Map<number, Uint8Array>();
  let currentKey = chainKey;

  for (let i = currentIteration; i <= targetIteration; i++) {
    const { nextChainKey, messageKey } = await senderKeyChainStep(backend, currentKey);
    if (i < targetIteration) {
      skippedKeys.set(i, messageKey);
    } else {
      return { chainKey: nextChainKey, messageKey, skippedKeys };
    }
    currentKey = nextChainKey;
  }

  throw new Error("Unreachable: fast-forward loop completed without returning");
}
