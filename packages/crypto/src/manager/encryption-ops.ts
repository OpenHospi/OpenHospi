import { getBackend } from "../backends/platform";
import {
  deserializeRatchetState,
  ratchetDecrypt,
  ratchetEncrypt,
  serializeRatchetState,
} from "../protocol/double-ratchet";
import { fromBase64, toBase64 } from "../protocol/encoding";
import { decrypt, encrypt } from "../protocol/encryption";
import { encodeSafetyNumberQR, generateSafetyNumber } from "../protocol/safety-number";
import type { EncryptedMessage, ServerPreKeyBundle } from "../protocol/types";
import type { CryptoStore } from "../store/types";

import { createSessionAsResponder, getOrCreateSession } from "./key-management";
import type { X3DHSessionMeta } from "./key-management";

// ── Types ──

export type CiphertextPayload = {
  recipientUserId: string;
  ciphertext: string;
  iv: string;
  ratchetPublicKey: string;
  messageNumber: number;
  previousChainLength: number;
  // X3DH metadata — only present on the first message of a new session
  ephemeralPublicKey?: string;
  senderIdentityKey?: string;
  usedSignedPreKeyId?: number;
  usedOneTimePreKeyId?: number;
};

export type EncryptResult = {
  encrypted: EncryptedMessage;
  x3dhMeta?: X3DHSessionMeta;
};

export type X3DHMetadata = {
  ephemeralPublicKey: string;
  senderIdentityKey: string;
  usedSignedPreKeyId: number;
  usedOneTimePreKeyId?: number;
};

export type FingerprintResult = {
  safetyNumber: string;
  qrPayload: string;
};

// ── Self-Encryption (HKDF-derived AES-256-GCM) ──

const SELF_ENCRYPT_SALT = new TextEncoder().encode("OpenHospiSelfEncryption");
const SELF_ENCRYPT_INFO = new TextEncoder().encode("self-encrypt");

async function deriveSelfKey(store: CryptoStore, userId: string): Promise<Uint8Array> {
  const backend = getBackend();
  const identity = await store.getStoredIdentity(userId);
  if (!identity) throw new Error("No identity found — cannot derive self-encryption key");
  return backend.hkdf(fromBase64(identity.dhPrivateKey), SELF_ENCRYPT_SALT, SELF_ENCRYPT_INFO, 32);
}

export async function encryptForSelf(
  store: CryptoStore,
  userId: string,
  plaintext: string,
): Promise<{ ciphertext: string; iv: string }> {
  const backend = getBackend();
  const key = await deriveSelfKey(store, userId);
  const { ciphertext, iv } = await encrypt(backend, key, new TextEncoder().encode(plaintext));
  return { ciphertext: toBase64(ciphertext), iv: toBase64(iv) };
}

export async function decryptForSelf(
  store: CryptoStore,
  userId: string,
  ciphertextB64: string,
  ivB64: string,
): Promise<string> {
  const backend = getBackend();
  const key = await deriveSelfKey(store, userId);
  const plaintext = await decrypt(backend, key, fromBase64(ciphertextB64), fromBase64(ivB64));
  return new TextDecoder().decode(plaintext);
}

// ── Double Ratchet Operations ──

export async function encryptForRecipient(
  store: CryptoStore,
  userId: string,
  conversationId: string,
  recipientUserId: string,
  plaintext: string,
  fetchBundle: (userId: string) => Promise<ServerPreKeyBundle | null>,
): Promise<EncryptResult> {
  const backend = getBackend();

  const { state, x3dhMeta } = await getOrCreateSession(
    store,
    conversationId,
    recipientUserId,
    userId,
    fetchBundle,
  );

  const { state: newState, encrypted } = await ratchetEncrypt(backend, state, plaintext);
  await store.saveSession(conversationId, recipientUserId, serializeRatchetState(newState));

  return { encrypted, x3dhMeta };
}

export async function decryptFromSender(
  store: CryptoStore,
  userId: string,
  conversationId: string,
  senderUserId: string,
  encrypted: EncryptedMessage,
  x3dhMeta?: X3DHMetadata | null,
): Promise<string> {
  const backend = getBackend();

  let serialized = await store.getSession(conversationId, senderUserId);

  // No session — create one as responder if X3DH metadata is available
  if (!serialized && x3dhMeta) {
    await createSessionAsResponder(store, conversationId, senderUserId, userId, x3dhMeta);
    serialized = await store.getSession(conversationId, senderUserId);
  }

  if (!serialized) {
    throw new Error("No session found and no X3DH metadata to establish one");
  }

  const state = deserializeRatchetState(serialized);
  const { state: newState, plaintext } = await ratchetDecrypt(backend, state, encrypted);
  await store.saveSession(conversationId, senderUserId, serializeRatchetState(newState));

  return plaintext;
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
