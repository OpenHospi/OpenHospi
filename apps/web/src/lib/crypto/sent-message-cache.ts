const DB_NAME = "openhospi-message-cache";
const DB_VERSION = 1;
const STORE_NAME = "messages";

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

/**
 * Client-side cache for decrypted plaintext of ALL messages (sent + received).
 * Signal's approach: crypto keys are one-time use, so after first decryption
 * we store the plaintext locally. On reload, read from cache instead of
 * re-decrypting (which would fail after the key is consumed).
 *
 * If the user clears browser data, old messages become unreadable.
 * This is the expected tradeoff of true E2E encryption.
 */
export class MessagePlaintextCache {
  async store(messageId: string, plaintext: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).put({ plaintext, timestamp: Date.now() }, messageId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async get(messageId: string): Promise<string | null> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const req = tx.objectStore(STORE_NAME).get(messageId);
      req.onsuccess = () => {
        const data = req.result as { plaintext: string } | undefined;
        resolve(data?.plaintext ?? null);
      };
      req.onerror = () => reject(req.error);
    });
  }
}
