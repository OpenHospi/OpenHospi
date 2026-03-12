/**
 * Separate IndexedDB store for sent message plaintext.
 * Signal protocol: sender stores plaintext locally, never decrypts own messages.
 */

const DB_NAME = "openhospi-sent-messages";
const DB_VERSION = 1;
const STORE_NAME = "plaintext";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const sentMessageCache = {
  async save(messageId: string, plaintext: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).put(plaintext, messageId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async get(messageId: string): Promise<string | null> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const request = tx.objectStore(STORE_NAME).get(messageId);
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => reject(request.error);
    });
  },

  async getMultiple(messageIds: string[]): Promise<Map<string, string>> {
    if (messageIds.length === 0) return new Map();
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const result = new Map<string, string>();
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      for (const id of messageIds) {
        const request = store.get(id);
        request.onsuccess = () => {
          if (request.result != null) {
            result.set(id, request.result as string);
          }
        };
      }
      tx.oncomplete = () => resolve(result);
      tx.onerror = () => reject(tx.error);
    });
  },
};
