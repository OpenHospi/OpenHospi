import { getCryptoProvider } from "../primitives/CryptoProvider";
import { toBase64 } from "../protocol/encoding";
import { groupDecrypt, groupEncrypt, initGroupSenderKey } from "../protocol/group-cipher";
import { deserializeDistributionMessage } from "../protocol/sender-key";
import type { ProtocolAddress, SenderKeyMessageData, SenderKeyRecord } from "../protocol/types";
import type { SenderKeyStore, SignalProtocolStore } from "../stores/types";

import { encrypt1to1 } from "./SessionManager";

/** Generate a random UUID-like distribution ID. */
function generateDistributionId(): string {
  const bytes = getCryptoProvider().randomBytes(16);
  return toBase64(bytes);
}

/**
 * Initialize a sender key for a conversation and generate distribution messages.
 * Uses a unique distributionId (not conversationId) so that key rotation
 * doesn't overwrite the old key state for in-flight messages.
 */
export async function initAndDistributeSenderKey(
  store: SignalProtocolStore,
  localAddress: ProtocolAddress,
  conversationId: string,
  memberAddresses: ProtocolAddress[],
): Promise<{
  distributions: Array<{
    recipientAddress: ProtocolAddress;
    encryptedDistribution: Uint8Array;
  }>;
}> {
  // Generate sender key with a unique distributionId
  const distributionId = generateDistributionId();
  const { record, distributionMessageBytes } = initGroupSenderKey(distributionId);

  // Store under conversationId so the sender can find it to encrypt
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
    },
  };

  await store.storeSenderKey(senderAddress, distMsg.distributionId, record);
}

/**
 * Encrypt a message for a group conversation using sender keys.
 * O(1) encryption regardless of group size.
 */
export async function encryptGroupMessage(
  store: SignalProtocolStore,
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
 * Looks up the sender key by the message's distributionId (not conversationId)
 * so that rotated keys don't interfere with in-flight messages.
 */
export async function decryptGroupMessage(
  store: SenderKeyStore,
  senderAddress: ProtocolAddress,
  conversationId: string,
  message: SenderKeyMessageData,
): Promise<Uint8Array> {
  // Try distributionId first (new behavior), fall back to conversationId (backward compat)
  let record = await store.loadSenderKey(senderAddress, message.distributionId);
  if (!record) {
    record = await store.loadSenderKey(senderAddress, conversationId);
  }
  if (!record) {
    throw new Error(
      `No sender key from ${senderAddress.userId}:${senderAddress.deviceId} for conversation ${conversationId}`,
    );
  }

  const { senderKeyRecord, plaintext } = groupDecrypt(record, message);

  // Update stored state under the distributionId
  await store.storeSenderKey(senderAddress, message.distributionId, senderKeyRecord);

  return plaintext;
}
