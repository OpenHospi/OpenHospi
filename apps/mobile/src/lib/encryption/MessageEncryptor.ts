/**
 * High-level message encryption for mobile.
 * Orchestrates session establishment, Sender Key distribution, and group encryption.
 */
import {
  setCryptoProvider,
  establishSession,
  encryptGroupMessage,
  distributeSenderKeyToDevice,
  getOrCreateSenderKey,
  toBase64,
  fromBase64,
} from '@openhospi/crypto';
import { createNativeCryptoProvider } from '@openhospi/crypto/native';
import type { ProtocolAddress, GroupCiphertextPayload, PreKeyBundle } from '@openhospi/crypto';

import { getMobileSignalStore } from '../crypto/stores';

let providerInitialized = false;

function ensureCryptoProvider() {
  if (!providerInitialized) {
    setCryptoProvider(createNativeCryptoProvider());
    providerInitialized = true;
  }
}

export interface EncryptionDependencies {
  /** Fetch prekey bundle for a user's device from the server. */
  fetchPreKeyBundle(userId: string, deviceId: number): Promise<PreKeyBundle | null>;
  /** Get all active device IDs for a user. */
  getDeviceIds(userId: string): Promise<number[]>;
  /** Send encrypted Sender Key distribution to server for delivery. */
  sendDistribution(
    conversationId: string,
    recipientAddress: ProtocolAddress,
    envelope: Uint8Array
  ): Promise<void>;
}

/**
 * Encrypt a message for a group conversation.
 * Handles session establishment and Sender Key distribution automatically.
 */
export async function encryptMessage(
  localUserId: string,
  localDeviceId: number,
  conversationId: string,
  memberUserIds: string[],
  plaintext: string,
  deps: EncryptionDependencies
): Promise<{ payload: GroupCiphertextPayload; senderKeyId: number }> {
  ensureCryptoProvider();
  const store = getMobileSignalStore();
  const localAddress: ProtocolAddress = { name: localUserId, deviceId: localDeviceId };

  // Ensure we have a Sender Key for this conversation
  const { isNew } = await getOrCreateSenderKey(store, localAddress, conversationId);

  // If new Sender Key, distribute to all member devices
  if (isNew) {
    for (const memberId of memberUserIds) {
      if (memberId === localUserId) continue;

      const deviceIds = await deps.getDeviceIds(memberId);
      for (const deviceId of deviceIds) {
        const remoteAddress: ProtocolAddress = { name: memberId, deviceId };

        // Establish session if needed
        const existingSession = await store.loadSession(remoteAddress);
        let preKeyInfo:
          | {
              identityKey: Uint8Array;
              ephemeralKey: Uint8Array;
              signedPreKeyId: number;
              oneTimePreKeyId?: number;
              registrationId: number;
            }
          | undefined;

        if (!existingSession) {
          const bundle = await deps.fetchPreKeyBundle(memberId, deviceId);
          if (!bundle) continue; // skip offline devices
          const result = await establishSession(store, remoteAddress, bundle);
          preKeyInfo = result.preKeyInfo;
        }

        // Distribute Sender Key via session cipher
        const envelope = await distributeSenderKeyToDevice(
          store,
          localAddress,
          remoteAddress,
          conversationId,
          preKeyInfo
        );

        // Serialize and send to server
        const serialized = new TextEncoder().encode(JSON.stringify(envelope));
        await deps.sendDistribution(conversationId, remoteAddress, serialized);
      }
    }
  }

  // Encrypt the actual message
  return encryptGroupMessage(store, localAddress, conversationId, plaintext, localUserId);
}

/**
 * Serialize a GroupCiphertextPayload for transmission.
 */
export function serializePayload(payload: GroupCiphertextPayload): string {
  return JSON.stringify({
    senderKeyId: payload.senderKeyId,
    iteration: payload.iteration,
    ciphertext: toBase64(payload.ciphertext),
    signature: toBase64(payload.signature),
  });
}

/**
 * Deserialize a GroupCiphertextPayload from transmission format.
 */
export function deserializePayload(data: string): GroupCiphertextPayload {
  const parsed = JSON.parse(data) as {
    senderKeyId: number;
    iteration: number;
    ciphertext: string;
    signature: string;
  };
  return {
    senderKeyId: parsed.senderKeyId,
    iteration: parsed.iteration,
    ciphertext: fromBase64(parsed.ciphertext),
    signature: fromBase64(parsed.signature),
  };
}
