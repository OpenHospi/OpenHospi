import { SENDER_KEY_MAX_AGE_MS, SENDER_KEY_MAX_MESSAGES } from "@openhospi/shared/constants";

import type { ProtocolAddress, SenderKeyRecord } from "../protocol/types";
import type { SenderKeyStore } from "../stores/types";

/**
 * Check if a sender key needs rotation based on age or message count.
 * Returns true if the key should be rotated (redistribute a fresh sender key).
 */
export function shouldRotateSenderKey(record: SenderKeyRecord, createdAt: number): boolean {
  // Rotate if too many messages have been sent with this key
  if (record.state.iteration >= SENDER_KEY_MAX_MESSAGES) {
    return true;
  }

  // Rotate if the key is older than the max age
  if (Date.now() - createdAt > SENDER_KEY_MAX_AGE_MS) {
    return true;
  }

  return false;
}

/**
 * Invalidate a sender key for a conversation.
 * Call this when a member is removed from a conversation to ensure forward secrecy.
 * The next message send will trigger a new sender key distribution.
 */
export async function invalidateSenderKey(
  store: SenderKeyStore,
  localAddress: ProtocolAddress,
  conversationId: string,
): Promise<void> {
  // Store a "null" record to force re-distribution
  // The encrypt flow checks for existing key — by removing it,
  // the next send will generate and distribute a fresh key
  await store.storeSenderKey(localAddress, conversationId, {
    state: {
      chainKey: new Uint8Array(0),
      iteration: SENDER_KEY_MAX_MESSAGES + 1, // Force rotation check
      signingKeyPair: {
        publicKey: new Uint8Array(0),
        privateKey: new Uint8Array(0),
      },
      messageKeys: new Map(),
    },
  });
}

/**
 * Invalidate all sender keys from a removed member in a conversation.
 * Call this for every device of the removed member so we stop trusting their keys.
 */
export async function invalidateRemovedMemberKeys(
  store: SenderKeyStore,
  removedMemberAddresses: ProtocolAddress[],
  conversationId: string,
): Promise<void> {
  for (const address of removedMemberAddresses) {
    // Remove their sender key so we reject any future messages from this key
    await store.storeSenderKey(address, conversationId, {
      state: {
        chainKey: new Uint8Array(0),
        iteration: 0,
        signingKeyPair: {
          publicKey: new Uint8Array(0),
          privateKey: new Uint8Array(0),
        },
        messageKeys: new Map(),
      },
    });
  }
}
