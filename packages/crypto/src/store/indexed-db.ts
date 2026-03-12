import type { SerializedSenderKeyState } from "../protocol/types";

import type { CryptoStore, StoredIdentity, StoredOneTimePreKey, StoredSignedPreKey } from "./types";

export class IndexedDBCryptoStore implements CryptoStore {
  constructor(
    private dbName: string,
    private dbVersion: number,
    private identityStore: string,
    private senderKeyStore: string,
    private prekeyStore: string,
  ) {}

  private openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.identityStore)) {
          db.createObjectStore(this.identityStore);
        }
        if (!db.objectStoreNames.contains(this.senderKeyStore)) {
          db.createObjectStore(this.senderKeyStore);
        }
        if (!db.objectStoreNames.contains(this.prekeyStore)) {
          db.createObjectStore(this.prekeyStore);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async idbGet<T>(storeName: string, key: string): Promise<T | null> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, "readonly");
      const store = tx.objectStore(storeName);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => reject(request.error);
    });
  }

  private async idbPut(storeName: string, key: string, value: unknown): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      const request = store.put(value, key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async idbDelete(storeName: string, key: string): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ── Identity ──

  async getStoredIdentity(userId: string): Promise<StoredIdentity | null> {
    return this.idbGet<StoredIdentity>(this.identityStore, userId);
  }

  async storeIdentity(userId: string, identity: StoredIdentity): Promise<void> {
    return this.idbPut(this.identityStore, userId, identity);
  }

  async deleteStoredIdentity(userId: string): Promise<void> {
    return this.idbDelete(this.identityStore, userId);
  }

  // ── Sender Keys ──

  private senderKeyKey(conversationId: string, senderUserId: string): string {
    return `${conversationId}:${senderUserId}`;
  }

  async getSenderKey(
    conversationId: string,
    senderUserId: string,
  ): Promise<SerializedSenderKeyState | null> {
    return this.idbGet<SerializedSenderKeyState>(
      this.senderKeyStore,
      this.senderKeyKey(conversationId, senderUserId),
    );
  }

  async saveSenderKey(
    conversationId: string,
    senderUserId: string,
    state: SerializedSenderKeyState,
  ): Promise<void> {
    return this.idbPut(this.senderKeyStore, this.senderKeyKey(conversationId, senderUserId), state);
  }

  async deleteSenderKey(conversationId: string, senderUserId: string): Promise<void> {
    return this.idbDelete(this.senderKeyStore, this.senderKeyKey(conversationId, senderUserId));
  }

  async deleteAllSenderKeys(conversationId: string): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.senderKeyStore, "readwrite");
      const store = tx.objectStore(this.senderKeyStore);
      const request = store.openCursor();
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          if (typeof cursor.key === "string" && cursor.key.startsWith(`${conversationId}:`)) {
            cursor.delete();
          }
          cursor.continue();
        }
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // ── Pre-Keys ──

  async getStoredSignedPreKeys(userId: string): Promise<StoredSignedPreKey[]> {
    return (await this.idbGet<StoredSignedPreKey[]>(this.prekeyStore, `spk:${userId}`)) ?? [];
  }

  async storeSignedPreKey(userId: string, spk: StoredSignedPreKey): Promise<void> {
    const existing = await this.getStoredSignedPreKeys(userId);
    existing.push(spk);
    return this.idbPut(this.prekeyStore, `spk:${userId}`, existing);
  }

  async getStoredOneTimePreKeys(userId: string): Promise<StoredOneTimePreKey[]> {
    return (await this.idbGet<StoredOneTimePreKey[]>(this.prekeyStore, `opk:${userId}`)) ?? [];
  }

  async storeOneTimePreKeys(userId: string, keys: StoredOneTimePreKey[]): Promise<void> {
    const existing = await this.getStoredOneTimePreKeys(userId);
    existing.push(...keys);
    return this.idbPut(this.prekeyStore, `opk:${userId}`, existing);
  }

  async consumeOneTimePreKey(userId: string, keyId: number): Promise<string | null> {
    const keys = await this.getStoredOneTimePreKeys(userId);
    const idx = keys.findIndex((k) => k.keyId === keyId);
    if (idx === -1) return null;
    const [consumed] = keys.splice(idx, 1);
    await this.idbPut(this.prekeyStore, `opk:${userId}`, keys);
    return consumed.privateKey;
  }

  async clearAllCryptoData(userId: string): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(
        [this.identityStore, this.senderKeyStore, this.prekeyStore],
        "readwrite",
      );

      tx.objectStore(this.identityStore).delete(userId);
      tx.objectStore(this.prekeyStore).delete(`spk:${userId}`);
      tx.objectStore(this.prekeyStore).delete(`opk:${userId}`);
      tx.objectStore(this.senderKeyStore).clear();

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}
