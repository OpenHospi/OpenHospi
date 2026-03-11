import { getBackend } from "../backends/platform";
import {
  deserializeRatchetState,
  ratchetDecrypt,
  ratchetEncrypt,
  serializeRatchetState,
} from "../protocol/double-ratchet";
import { fromBase64 } from "../protocol/encoding";
import { encodeSafetyNumberQR, generateSafetyNumber } from "../protocol/safety-number";
import type { EncryptedMessage, ServerPreKeyBundle } from "../protocol/types";
import type { CryptoStore } from "../store/types";

import { getOrCreateSession } from "./key-management";

export type CiphertextPayload = {
  recipientUserId: string;
  ciphertext: string;
  iv: string;
  ratchetPublicKey: string;
  messageNumber: number;
  previousChainLength: number;
};

export type FingerprintResult = {
  safetyNumber: string;
  qrPayload: string;
};

export async function encryptForRecipient(
  store: CryptoStore,
  userId: string,
  conversationId: string,
  recipientUserId: string,
  plaintext: string,
  fetchBundle: (userId: string) => Promise<ServerPreKeyBundle | null>,
): Promise<EncryptedMessage> {
  const backend = getBackend();

  const state = await getOrCreateSession(
    store,
    conversationId,
    recipientUserId,
    userId,
    fetchBundle,
  );

  const { state: newState, encrypted } = await ratchetEncrypt(backend, state, plaintext);
  await store.saveSession(conversationId, recipientUserId, serializeRatchetState(newState));

  return encrypted;
}

export async function decryptFromSender(
  store: CryptoStore,
  userId: string,
  conversationId: string,
  senderUserId: string,
  encrypted: EncryptedMessage,
): Promise<string> {
  const backend = getBackend();

  const serialized = await store.getSession(conversationId, senderUserId);
  if (!serialized) {
    throw new Error("No session found for this sender — message cannot be decrypted");
  }

  const state = deserializeRatchetState(serialized);
  const { state: newState, plaintext } = await ratchetDecrypt(backend, state, encrypted);
  await store.saveSession(conversationId, senderUserId, serializeRatchetState(newState));

  return plaintext;
}

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
