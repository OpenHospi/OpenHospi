"use client";

/**
 * IndexedDB store for Signal Protocol E2EE data:
 * - "identity" store: user's identity key pair (Ed25519 signing + X25519 DH)
 * - "sessions" store: Double Ratchet session states per conversation×user pair
 * - "prekeys" store: local signed pre-key and one-time pre-key private keys
 */

import type { SerializedRatchetState } from "@openhospi/crypto";
import {
  INDEXED_DB_IDENTITY_STORE,
  INDEXED_DB_NAME,
  INDEXED_DB_PREKEY_STORE,
  INDEXED_DB_SESSION_STORE,
  INDEXED_DB_VERSION,
} from "@openhospi/shared/constants";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(INDEXED_DB_NAME, INDEXED_DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(INDEXED_DB_IDENTITY_STORE)) {
        db.createObjectStore(INDEXED_DB_IDENTITY_STORE);
      }
      if (!db.objectStoreNames.contains(INDEXED_DB_SESSION_STORE)) {
        db.createObjectStore(INDEXED_DB_SESSION_STORE);
      }
      if (!db.objectStoreNames.contains(INDEXED_DB_PREKEY_STORE)) {
        db.createObjectStore(INDEXED_DB_PREKEY_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ── Generic helpers ──

async function idbGet<T>(storeName: string, key: string): Promise<T | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error);
  });
}

async function idbPut(storeName: string, key: string, value: unknown): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const request = store.put(value, key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function idbDelete(storeName: string, key: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const request = store.delete(key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// ── Identity Key Pair ──

export type StoredIdentity = {
  signingPublicKey: string; // base64
  signingPrivateKey: string; // base64
  dhPublicKey: string; // base64
  dhPrivateKey: string; // base64
};

export async function getStoredIdentity(userId: string): Promise<StoredIdentity | null> {
  return idbGet<StoredIdentity>(INDEXED_DB_IDENTITY_STORE, userId);
}

export async function storeIdentity(userId: string, identity: StoredIdentity): Promise<void> {
  return idbPut(INDEXED_DB_IDENTITY_STORE, userId, identity);
}

export async function deleteStoredIdentity(userId: string): Promise<void> {
  return idbDelete(INDEXED_DB_IDENTITY_STORE, userId);
}

// ── Double Ratchet Sessions ──

/** Session key format: `${conversationId}:${otherUserId}` */
function sessionKey(conversationId: string, otherUserId: string): string {
  return `${conversationId}:${otherUserId}`;
}

export async function getSession(
  conversationId: string,
  otherUserId: string,
): Promise<SerializedRatchetState | null> {
  return idbGet<SerializedRatchetState>(
    INDEXED_DB_SESSION_STORE,
    sessionKey(conversationId, otherUserId),
  );
}

export async function saveSession(
  conversationId: string,
  otherUserId: string,
  state: SerializedRatchetState,
): Promise<void> {
  return idbPut(INDEXED_DB_SESSION_STORE, sessionKey(conversationId, otherUserId), state);
}

export async function deleteSession(conversationId: string, otherUserId: string): Promise<void> {
  return idbDelete(INDEXED_DB_SESSION_STORE, sessionKey(conversationId, otherUserId));
}

// ── Pre-Key Private Keys ──

export type StoredSignedPreKey = {
  keyId: number;
  privateKey: string; // base64
  publicKey: string; // base64
};

export type StoredOneTimePreKey = {
  keyId: number;
  privateKey: string; // base64
};

export async function getStoredSignedPreKeys(userId: string): Promise<StoredSignedPreKey[]> {
  return (await idbGet<StoredSignedPreKey[]>(INDEXED_DB_PREKEY_STORE, `spk:${userId}`)) ?? [];
}

export async function storeSignedPreKey(userId: string, spk: StoredSignedPreKey): Promise<void> {
  const existing = await getStoredSignedPreKeys(userId);
  existing.push(spk);
  return idbPut(INDEXED_DB_PREKEY_STORE, `spk:${userId}`, existing);
}

export async function getStoredOneTimePreKeys(userId: string): Promise<StoredOneTimePreKey[]> {
  return (await idbGet<StoredOneTimePreKey[]>(INDEXED_DB_PREKEY_STORE, `opk:${userId}`)) ?? [];
}

export async function storeOneTimePreKeys(
  userId: string,
  keys: StoredOneTimePreKey[],
): Promise<void> {
  const existing = await getStoredOneTimePreKeys(userId);
  existing.push(...keys);
  return idbPut(INDEXED_DB_PREKEY_STORE, `opk:${userId}`, existing);
}

export async function consumeOneTimePreKey(userId: string, keyId: number): Promise<string | null> {
  const keys = await getStoredOneTimePreKeys(userId);
  const idx = keys.findIndex((k) => k.keyId === keyId);
  if (idx === -1) return null;
  const [consumed] = keys.splice(idx, 1);
  await idbPut(INDEXED_DB_PREKEY_STORE, `opk:${userId}`, keys);
  return consumed.privateKey;
}

/** Clear all crypto data for a user (used on key reset) */
export async function clearAllCryptoData(userId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(
      [INDEXED_DB_IDENTITY_STORE, INDEXED_DB_SESSION_STORE, INDEXED_DB_PREKEY_STORE],
      "readwrite",
    );

    tx.objectStore(INDEXED_DB_IDENTITY_STORE).delete(userId);
    tx.objectStore(INDEXED_DB_PREKEY_STORE).delete(`spk:${userId}`);
    tx.objectStore(INDEXED_DB_PREKEY_STORE).delete(`opk:${userId}`);

    // Clear all sessions (can't filter by key prefix in IDB, so clear all)
    tx.objectStore(INDEXED_DB_SESSION_STORE).clear();

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
