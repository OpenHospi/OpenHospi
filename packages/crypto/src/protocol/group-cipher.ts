import {
  createDistributionMessage,
  generateSenderKeyState,
  senderKeyDecrypt,
  senderKeyEncrypt,
  serializeDistributionMessage,
} from "./sender-key";
import type {
  ProtocolAddress,
  SenderKeyMessageData,
  SenderKeyRecord,
  SenderKeyState,
} from "./types";

export interface GroupEncryptResult {
  senderKeyRecord: SenderKeyRecord;
  message: SenderKeyMessageData;
}

export interface GroupDecryptResult {
  senderKeyRecord: SenderKeyRecord;
  plaintext: Uint8Array;
}

/**
 * Initialize a new sender key for a group conversation.
 * Returns the state and the distribution message bytes to send to each member.
 */
export function initGroupSenderKey(distributionId: string): {
  record: SenderKeyRecord;
  distributionMessageBytes: Uint8Array;
} {
  const state = generateSenderKeyState(distributionId);
  const distMsg = createDistributionMessage(distributionId, state);
  const distributionMessageBytes = serializeDistributionMessage(distMsg);

  return {
    record: { state },
    distributionMessageBytes,
  };
}

/**
 * Encrypt a plaintext message for a group using the sender key.
 * O(1) — single encrypt regardless of group size.
 */
export function groupEncrypt(
  distributionId: string,
  record: SenderKeyRecord,
  plaintext: Uint8Array,
): GroupEncryptResult {
  const { state, message } = senderKeyEncrypt(distributionId, record.state, plaintext);
  return {
    senderKeyRecord: { state },
    message,
  };
}

/**
 * Decrypt a group message using the sender's key.
 * The caller must have processed the sender key distribution message first.
 */
export function groupDecrypt(
  record: SenderKeyRecord,
  message: SenderKeyMessageData,
): GroupDecryptResult {
  const { state, plaintext } = senderKeyDecrypt(record.state, message);
  return {
    senderKeyRecord: { state },
    plaintext,
  };
}
