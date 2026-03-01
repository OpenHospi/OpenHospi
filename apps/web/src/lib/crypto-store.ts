"use client";

/**
 * IndexedDB store for the user's private key.
 * The key is stored as a non-extractable CryptoKey when possible,
 * but we store the JWK for portability across browsers.
 */

import { INDEXED_DB_NAME, INDEXED_DB_STORE_NAME, INDEXED_DB_VERSION } from "@openhospi/shared/constants";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(INDEXED_DB_NAME, INDEXED_DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(INDEXED_DB_STORE_NAME)) {
        db.createObjectStore(INDEXED_DB_STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getStoredPrivateKey(userId: string): Promise<JsonWebKey | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(INDEXED_DB_STORE_NAME, "readonly");
    const store = tx.objectStore(INDEXED_DB_STORE_NAME);
    const request = store.get(userId);
    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error);
  });
}

export async function storePrivateKey(userId: string, privateKeyJwk: JsonWebKey): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(INDEXED_DB_STORE_NAME, "readwrite");
    const store = tx.objectStore(INDEXED_DB_STORE_NAME);
    const request = store.put(privateKeyJwk, userId);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteStoredPrivateKey(userId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(INDEXED_DB_STORE_NAME, "readwrite");
    const store = tx.objectStore(INDEXED_DB_STORE_NAME);
    const request = store.delete(userId);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
