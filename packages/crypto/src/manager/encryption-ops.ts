import { getBackend } from "../backends/platform";
import { fromBase64 } from "../protocol/encoding";
import { encodeSafetyNumberQR, generateSafetyNumber } from "../protocol/safety-number";
import {
  deserializeSenderKeyState,
  StaleSenderKeyError,
  senderKeyDecrypt,
  senderKeyEncrypt,
  serializeSenderKeyState,
} from "../protocol/sender-key";
import type {
  GroupCiphertextPayload,
  SenderKeyDistributionEnvelope,
  ServerPreKeyBundle,
} from "../protocol/types";
import type { CryptoStore } from "../store/types";

import {
  distributeSenderKey,
  getOrCreateOwnSenderKey,
  receiveSenderKeyDistribution,
} from "./key-management";

export type FingerprintResult = {
  safetyNumber: string;
  qrPayload: string;
};

/**
 * Encrypt a message for the group using Sender Keys.
 *
 * 1. Get/create own Sender Key
 * 2. Distribute to members who don't have it yet
 * 3. Encrypt once for the group
 */
export async function encryptGroupMessage(
  store: CryptoStore,
  userId: string,
  conversationId: string,
  memberUserIds: string[],
  plaintext: string,
  fetchBundle: (userId: string) => Promise<ServerPreKeyBundle | null>,
  storeDistributions: (
    distributions: Array<{
      recipientUserId: string;
      envelope: SenderKeyDistributionEnvelope;
    }>,
  ) => Promise<void>,
  getExistingDistributionRecipients: (conversationId: string) => Promise<string[]>,
): Promise<GroupCiphertextPayload> {
  const { state, isNew } = await getOrCreateOwnSenderKey(store, conversationId, userId);

  const otherMembers = memberUserIds.filter((id) => id !== userId);

  let membersToDistribute: string[];
  if (isNew) {
    membersToDistribute = otherMembers;
  } else {
    const existingRecipients = await getExistingDistributionRecipients(conversationId);
    const existingSet = new Set(existingRecipients);
    membersToDistribute = otherMembers.filter((id) => !existingSet.has(id));
  }

  if (membersToDistribute.length > 0) {
    const distributions = await distributeSenderKey(
      store,
      conversationId,
      userId,
      membersToDistribute,
      state,
      fetchBundle,
    );
    if (distributions.length > 0) {
      await storeDistributions(distributions);
    }
  }

  const { state: newState, payload } = await senderKeyEncrypt(
    getBackend(),
    state,
    plaintext,
    conversationId,
    userId,
  );

  await store.saveSenderKey(conversationId, userId, serializeSenderKeyState(newState));

  return payload;
}

/**
 * Decrypt a group message using the sender's Sender Key.
 *
 * 1. Look up sender's Sender Key by chainId from the payload
 * 2. If not found, fetch the distribution from the server
 * 3. On StaleSenderKeyError, fetch fresh distribution and retry once
 */
export async function decryptGroupMessage(
  store: CryptoStore,
  userId: string,
  conversationId: string,
  senderUserId: string,
  payload: GroupCiphertextPayload,
  fetchDistribution: (
    conversationId: string,
    senderUserId: string,
  ) => Promise<SenderKeyDistributionEnvelope | null>,
): Promise<string> {
  // Look up by chainId first for correct multi-state resolution
  let serialized = await store.getSenderKey(conversationId, senderUserId, payload.chainId);

  if (!serialized) {
    // Try without chainId (latest state) as fallback
    serialized = await store.getSenderKey(conversationId, senderUserId);
  }

  if (!serialized) {
    // No local key at all — fetch distribution
    const envelope = await fetchDistribution(conversationId, senderUserId);
    if (!envelope) {
      throw new Error("No Sender Key found and no distribution available from server");
    }
    await receiveSenderKeyDistribution(store, conversationId, senderUserId, userId, envelope);
    serialized = await store.getSenderKey(conversationId, senderUserId, payload.chainId);
    if (!serialized) {
      serialized = await store.getSenderKey(conversationId, senderUserId);
    }
    if (!serialized) {
      throw new Error("Failed to store received Sender Key distribution");
    }
  }

  const state = deserializeSenderKeyState(serialized);
  const signingPublicKey = fromBase64(serialized.signingPublicKey);

  try {
    const { state: newState, plaintext } = await senderKeyDecrypt(
      getBackend(),
      state,
      payload,
      signingPublicKey,
      conversationId,
      senderUserId,
    );

    await store.saveSenderKey(conversationId, senderUserId, serializeSenderKeyState(newState));

    return plaintext;
  } catch (firstError) {
    // On stale key error for another user's message, try fetching fresh distribution
    if (firstError instanceof StaleSenderKeyError && senderUserId !== userId) {
      const envelope = await fetchDistribution(conversationId, senderUserId);
      if (envelope) {
        await receiveSenderKeyDistribution(store, conversationId, senderUserId, userId, envelope);
        const freshSerialized = await store.getSenderKey(
          conversationId,
          senderUserId,
          payload.chainId,
        );
        if (freshSerialized) {
          const freshState = deserializeSenderKeyState(freshSerialized);
          const freshSigningKey = fromBase64(freshSerialized.signingPublicKey);

          const { state: newState, plaintext } = await senderKeyDecrypt(
            getBackend(),
            freshState,
            payload,
            freshSigningKey,
            conversationId,
            senderUserId,
          );

          await store.saveSenderKey(
            conversationId,
            senderUserId,
            serializeSenderKeyState(newState),
          );

          return plaintext;
        }
      }
    }
    throw firstError;
  }
}

// ── Safety Numbers ──

export async function getIdentityFingerprint(
  store: CryptoStore,
  userId: string,
  otherUserId: string,
  fetchIdentityKeys: (userIds: string[]) => Promise<{ signingPublicKey: string }[]>,
): Promise<FingerprintResult | null> {
  const myIdentity = await store.getStoredIdentity(userId);
  if (!myIdentity) return null;

  const [theirKeys] = await fetchIdentityKeys([otherUserId]);
  if (!theirKeys) return null;

  const safetyNumber = await generateSafetyNumber(
    userId,
    fromBase64(myIdentity.signingPublicKey),
    otherUserId,
    fromBase64(theirKeys.signingPublicKey),
  );

  const qrPayload = encodeSafetyNumberQR(
    userId,
    fromBase64(myIdentity.signingPublicKey),
    safetyNumber,
  );

  return { safetyNumber, qrPayload };
}
