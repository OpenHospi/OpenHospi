import { groupDecrypt, groupEncrypt, initGroupSenderKey } from "../protocol/group-cipher";
import { deserializeDistributionMessage } from "../protocol/sender-key";
import type { ProtocolAddress, SenderKeyMessageData, SenderKeyRecord } from "../protocol/types";
import type { ProtocolStore, SenderKeyStore } from "../stores/types";

import { encrypt1to1 } from "./SessionManager";

/**
 * Initialize a sender key for a conversation and generate distribution messages.
 * The distribution message must be encrypted via 1:1 session and sent to each member device.
 */
export async function initAndDistributeSenderKey(
  store: ProtocolStore,
  localAddress: ProtocolAddress,
  conversationId: string,
  memberAddresses: ProtocolAddress[],
): Promise<{
  distributions: Array<{
    recipientAddress: ProtocolAddress;
    encryptedDistribution: Uint8Array;
  }>;
}> {
  // Generate sender key (conversationId as distributionId for consistent lookups)
  const { record, distributionMessageBytes } = initGroupSenderKey(conversationId);

  // Store our own sender key
  await store.storeSenderKey(localAddress, conversationId, record);

  // Encrypt distribution message for each member via their 1:1 session
  const distributions: Array<{
    recipientAddress: ProtocolAddress;
    encryptedDistribution: Uint8Array;
  }> = [];

  for (const memberAddress of memberAddresses) {
    // Skip ourselves
    if (
      memberAddress.userId === localAddress.userId &&
      memberAddress.deviceId === localAddress.deviceId
    ) {
      continue;
    }

    const encryptedDistribution = await encrypt1to1(store, memberAddress, distributionMessageBytes);

    distributions.push({
      recipientAddress: memberAddress,
      encryptedDistribution,
    });
  }

  return { distributions };
}

/**
 * Process a received sender key distribution message.
 * The ciphertext has been decrypted via the 1:1 session already.
 */
export async function processDistribution(
  store: SenderKeyStore,
  senderAddress: ProtocolAddress,
  distributionBytes: Uint8Array,
): Promise<void> {
  const distMsg = deserializeDistributionMessage(distributionBytes);

  const record: SenderKeyRecord = {
    state: {
      chainKey: distMsg.chainKey,
      iteration: distMsg.iteration,
      signingKeyPair: {
        publicKey: distMsg.signingKey,
        privateKey: new Uint8Array(0), // We only have the public key for received sender keys
      },
      messageKeys: new Map(),
    },
  };

  await store.storeSenderKey(senderAddress, distMsg.distributionId, record);
}

/**
 * Encrypt a message for a group conversation using sender keys.
 * O(1) encryption regardless of group size.
 */
export async function encryptGroupMessage(
  store: ProtocolStore,
  localAddress: ProtocolAddress,
  conversationId: string,
  plaintext: Uint8Array,
): Promise<SenderKeyMessageData> {
  const record = await store.loadSenderKey(localAddress, conversationId);
  if (!record) {
    throw new Error(
      `No sender key for conversation ${conversationId}. Call initAndDistributeSenderKey first.`,
    );
  }

  const { senderKeyRecord, message } = groupEncrypt(conversationId, record, plaintext);

  // Update stored state
  await store.storeSenderKey(localAddress, conversationId, senderKeyRecord);

  return message;
}

/**
 * Decrypt a group message from a specific sender.
 */
export async function decryptGroupMessage(
  store: SenderKeyStore,
  senderAddress: ProtocolAddress,
  conversationId: string,
  message: SenderKeyMessageData,
): Promise<Uint8Array> {
  const record = await store.loadSenderKey(senderAddress, conversationId);
  if (!record) {
    throw new Error(
      `No sender key from ${senderAddress.userId}:${senderAddress.deviceId} for conversation ${conversationId}`,
    );
  }

  const { senderKeyRecord, plaintext } = groupDecrypt(record, message);

  // Update stored state
  await store.storeSenderKey(senderAddress, conversationId, senderKeyRecord);

  return plaintext;
}
