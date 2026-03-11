import type { SerializedRatchetState } from '@openhospi/crypto';

import { SecureStorage } from './secure-storage';

// ── Types ──

export type StoredIdentity = {
  signingPublicKey: string; // base64
  signingPrivateKey: string; // base64
  dhPublicKey: string; // base64
  dhPrivateKey: string; // base64
};

export type StoredSignedPreKey = {
  keyId: number;
  privateKey: string; // base64
  publicKey: string; // base64
};

export type StoredOneTimePreKey = {
  keyId: number;
  privateKey: string; // base64
};

// ── Identity Key Pair ──

export async function getStoredIdentity(userId: string): Promise<StoredIdentity | null> {
  const data = await SecureStorage.get(`identity:${userId}`);
  return data ? (JSON.parse(data) as StoredIdentity) : null;
}

export async function storeIdentity(userId: string, identity: StoredIdentity): Promise<void> {
  await SecureStorage.set(`identity:${userId}`, JSON.stringify(identity));
}

export async function deleteStoredIdentity(userId: string): Promise<void> {
  await SecureStorage.delete(`identity:${userId}`);
}

// ── Double Ratchet Sessions ──

function sessionKey(conversationId: string, otherUserId: string): string {
  return `session:${conversationId}:${otherUserId}`;
}

export async function getSession(
  conversationId: string,
  otherUserId: string
): Promise<SerializedRatchetState | null> {
  const data = await SecureStorage.get(sessionKey(conversationId, otherUserId));
  return data ? (JSON.parse(data) as SerializedRatchetState) : null;
}

export async function saveSession(
  conversationId: string,
  otherUserId: string,
  state: SerializedRatchetState
): Promise<void> {
  await SecureStorage.set(sessionKey(conversationId, otherUserId), JSON.stringify(state));
}

export async function deleteSession(conversationId: string, otherUserId: string): Promise<void> {
  await SecureStorage.delete(sessionKey(conversationId, otherUserId));
}

// ── Pre-Key Private Keys ──

export async function getStoredSignedPreKeys(userId: string): Promise<StoredSignedPreKey[]> {
  const data = await SecureStorage.get(`spk:${userId}`);
  return data ? (JSON.parse(data) as StoredSignedPreKey[]) : [];
}

export async function storeSignedPreKey(userId: string, spk: StoredSignedPreKey): Promise<void> {
  const existing = await getStoredSignedPreKeys(userId);
  existing.push(spk);
  await SecureStorage.set(`spk:${userId}`, JSON.stringify(existing));
}

export async function getStoredOneTimePreKeys(userId: string): Promise<StoredOneTimePreKey[]> {
  const data = await SecureStorage.get(`opk:${userId}`);
  return data ? (JSON.parse(data) as StoredOneTimePreKey[]) : [];
}

export async function storeOneTimePreKeys(
  userId: string,
  keys: StoredOneTimePreKey[]
): Promise<void> {
  const existing = await getStoredOneTimePreKeys(userId);
  existing.push(...keys);
  await SecureStorage.set(`opk:${userId}`, JSON.stringify(existing));
}

export async function consumeOneTimePreKey(userId: string, keyId: number): Promise<string | null> {
  const keys = await getStoredOneTimePreKeys(userId);
  const idx = keys.findIndex((k) => k.keyId === keyId);
  if (idx === -1) return null;
  const [consumed] = keys.splice(idx, 1);
  await SecureStorage.set(`opk:${userId}`, JSON.stringify(keys));
  return consumed.privateKey;
}

// ── Clear all crypto data for a user (used on key reset) ──

export async function clearAllCryptoData(userId: string): Promise<void> {
  await SecureStorage.delete(`identity:${userId}`);
  await SecureStorage.delete(`spk:${userId}`);
  await SecureStorage.delete(`opk:${userId}`);
  // Clear all sessions — can't filter by key prefix, so clear the entire crypto store
  await SecureStorage.clear();
}
