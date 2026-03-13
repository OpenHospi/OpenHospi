/**
 * High-level message decryption for mobile.
 * Handles Sender Key distribution messages and group message decryption.
 */
import {
  setCryptoProvider,
  decryptGroupMessage,
  receiveSenderKeyDistribution,
} from '@openhospi/crypto';
import { createNativeCryptoProvider } from '@openhospi/crypto/native';
import type { ProtocolAddress, GroupCiphertextPayload, MessageEnvelope } from '@openhospi/crypto';

import { getMobileSignalStore } from '../crypto/stores';

let providerInitialized = false;

function ensureCryptoProvider() {
  if (!providerInitialized) {
    setCryptoProvider(createNativeCryptoProvider());
    providerInitialized = true;
  }
}

/**
 * Process an incoming Sender Key distribution message.
 * Must be called before the first group message from a sender can be decrypted.
 */
export async function processDistribution(
  senderUserId: string,
  senderDeviceId: number,
  conversationId: string,
  envelopeJson: string
): Promise<void> {
  ensureCryptoProvider();
  const store = getMobileSignalStore();
  const senderAddress: ProtocolAddress = { name: senderUserId, deviceId: senderDeviceId };
  const envelope = JSON.parse(envelopeJson) as MessageEnvelope;

  await receiveSenderKeyDistribution(store, senderAddress, conversationId, envelope);
}

/**
 * Decrypt a group message using the sender's stored Sender Key.
 */
export async function decryptMessage(
  senderUserId: string,
  senderDeviceId: number,
  conversationId: string,
  payload: GroupCiphertextPayload
): Promise<string> {
  ensureCryptoProvider();
  const store = getMobileSignalStore();
  const senderAddress: ProtocolAddress = { name: senderUserId, deviceId: senderDeviceId };

  return decryptGroupMessage(store, senderAddress, conversationId, payload, senderUserId);
}
