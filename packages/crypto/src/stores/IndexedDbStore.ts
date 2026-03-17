import { toBase64, fromBase64 } from "../protocol/encoding";
import type {
  IdentityKeyPair,
  OneTimePreKey,
  ProtocolAddress,
  SenderKeyState,
  SessionState,
  SignedPreKey,
  SkippedKey,
} from "../protocol/types";

import type { SignalProtocolStore } from "./types";

const DB_NAME = "openhospi_signal_store";
const DB_VERSION = 1;

const STORES = {
  identity: "identity",
  preKeys: "preKeys",
  signedPreKeys: "signedPreKeys",
  sessions: "sessions",
  senderKeys: "senderKeys",
  skippedKeys: "skippedKeys",
  remoteIdentities: "remoteIdentities",
} as const;

function addressKey(addr: ProtocolAddress): string {
  return `${addr.name}.${addr.deviceId}`;
}

function senderKeyKey(sender: ProtocolAddress, distributionId: string): string {
  return `${addressKey(sender)}:${distributionId}`;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      for (const storeName of Object.values(STORES)) {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName);
        }
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function txGet<T>(db: IDBDatabase, storeName: string, key: string): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result as T | undefined);
    request.onerror = () => reject(request.error);
  });
}

function txPut(db: IDBDatabase, storeName: string, key: string, value: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    store.put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function txDelete(db: IDBDatabase, storeName: string, key: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    store.delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function txGetAllKeys(db: IDBDatabase, storeName: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const request = store.getAllKeys();
    request.onsuccess = () => resolve(request.result as string[]);
    request.onerror = () => reject(request.error);
  });
}

function txCount(db: IDBDatabase, storeName: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const request = store.count();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ── Serialization helpers ──

function serializeKeyPair(kp: { publicKey: Uint8Array; privateKey: Uint8Array }) {
  return { publicKey: toBase64(kp.publicKey), privateKey: toBase64(kp.privateKey) };
}

function deserializeKeyPair(data: { publicKey: string; privateKey: string }) {
  return { publicKey: fromBase64(data.publicKey), privateKey: fromBase64(data.privateKey) };
}

/**
 * IndexedDB-backed store implementing all Signal protocol store interfaces.
 * Used on the web platform (Next.js).
 */
export function createIndexedDbStore(): SignalProtocolStore {
  let dbPromise: Promise<IDBDatabase> | null = null;

  function getDb(): Promise<IDBDatabase> {
    if (!dbPromise) dbPromise = openDB();
    return dbPromise;
  }

  return {
    // ── Identity Key Store ──

    async getIdentityKeyPair(): Promise<IdentityKeyPair> {
      const db = await getDb();
      const data = await txGet<{
        signingKeyPair: { publicKey: string; privateKey: string };
        dhKeyPair: { publicKey: string; privateKey: string };
      }>(db, STORES.identity, "identityKeyPair");
      if (!data) throw new Error("Identity key pair not found");
      return {
        signingKeyPair: deserializeKeyPair(data.signingKeyPair),
        dhKeyPair: deserializeKeyPair(data.dhKeyPair),
      };
    },

    async getLocalRegistrationId(): Promise<number> {
      const db = await getDb();
      const data = await txGet<number>(db, STORES.identity, "registrationId");
      if (data === undefined) throw new Error("Registration ID not found");
      return data;
    },

    async storeIdentityKeyPair(identity: IdentityKeyPair, registrationId: number): Promise<void> {
      const db = await getDb();
      await txPut(db, STORES.identity, "identityKeyPair", {
        signingKeyPair: serializeKeyPair(identity.signingKeyPair),
        dhKeyPair: serializeKeyPair(identity.dhKeyPair),
      });
      await txPut(db, STORES.identity, "registrationId", registrationId);
    },

    async saveIdentity(address: ProtocolAddress, identityKey: Uint8Array): Promise<boolean> {
      const db = await getDb();
      const key = addressKey(address);
      const existing = await txGet<string>(db, STORES.remoteIdentities, key);
      const encoded = toBase64(identityKey);
      await txPut(db, STORES.remoteIdentities, key, encoded);
      return existing !== undefined && existing !== encoded;
    },

    async isTrustedIdentity(address: ProtocolAddress, identityKey: Uint8Array): Promise<boolean> {
      const db = await getDb();
      const existing = await txGet<string>(db, STORES.remoteIdentities, addressKey(address));
      if (!existing) return true; // new identity, trust on first use
      return existing === toBase64(identityKey);
    },

    // ── Pre Key Store ──

    async loadPreKey(preKeyId: number): Promise<OneTimePreKey> {
      const db = await getDb();
      const data = await txGet<{
        keyId: number;
        keyPair: { publicKey: string; privateKey: string };
      }>(db, STORES.preKeys, String(preKeyId));
      if (!data) throw new Error(`PreKey ${preKeyId} not found`);
      return { keyId: data.keyId, keyPair: deserializeKeyPair(data.keyPair) };
    },

    async storePreKey(preKeyId: number, record: OneTimePreKey): Promise<void> {
      const db = await getDb();
      await txPut(db, STORES.preKeys, String(preKeyId), {
        keyId: record.keyId,
        keyPair: serializeKeyPair(record.keyPair),
      });
    },

    async removePreKey(preKeyId: number): Promise<void> {
      const db = await getDb();
      await txDelete(db, STORES.preKeys, String(preKeyId));
    },

    async getAvailablePreKeyCount(): Promise<number> {
      const db = await getDb();
      return txCount(db, STORES.preKeys);
    },

    // ── Signed Pre Key Store ──

    async loadSignedPreKey(signedPreKeyId: number): Promise<SignedPreKey> {
      const db = await getDb();
      const data = await txGet<{
        keyId: number;
        keyPair: { publicKey: string; privateKey: string };
        signature: string;
      }>(db, STORES.signedPreKeys, String(signedPreKeyId));
      if (!data) throw new Error(`SignedPreKey ${signedPreKeyId} not found`);
      return {
        keyId: data.keyId,
        keyPair: deserializeKeyPair(data.keyPair),
        signature: fromBase64(data.signature),
      };
    },

    async storeSignedPreKey(signedPreKeyId: number, record: SignedPreKey): Promise<void> {
      const db = await getDb();
      await txPut(db, STORES.signedPreKeys, String(signedPreKeyId), {
        keyId: record.keyId,
        keyPair: serializeKeyPair(record.keyPair),
        signature: toBase64(record.signature),
      });
    },

    // ── Session Store ──

    async loadSession(address: ProtocolAddress): Promise<SessionState | null> {
      const db = await getDb();
      const data = await txGet<string>(db, STORES.sessions, addressKey(address));
      if (!data) return null;
      return deserializeSession(JSON.parse(data));
    },

    async storeSession(address: ProtocolAddress, record: SessionState): Promise<void> {
      const db = await getDb();
      await txPut(
        db,
        STORES.sessions,
        addressKey(address),
        JSON.stringify(serializeSession(record)),
      );
    },

    async deleteSession(address: ProtocolAddress): Promise<void> {
      const db = await getDb();
      await txDelete(db, STORES.sessions, addressKey(address));
    },

    async getSubDeviceSessions(userId: string): Promise<number[]> {
      const db = await getDb();
      const allKeys = await txGetAllKeys(db, STORES.sessions);
      const prefix = `${userId}.`;
      return allKeys
        .filter((k) => k.startsWith(prefix))
        .map((k) => parseInt(k.slice(prefix.length), 10))
        .filter((n) => !isNaN(n));
    },

    // ── Sender Key Store ──

    async storeSenderKey(
      sender: ProtocolAddress,
      distributionId: string,
      record: SenderKeyState,
    ): Promise<void> {
      const db = await getDb();
      await txPut(db, STORES.senderKeys, senderKeyKey(sender, distributionId), {
        senderKeyId: record.senderKeyId,
        chainKey: toBase64(record.chainKey),
        signatureKeyPair: serializeKeyPair(record.signatureKeyPair),
        iteration: record.iteration,
      });
    },

    async loadSenderKey(
      sender: ProtocolAddress,
      distributionId: string,
    ): Promise<SenderKeyState | null> {
      const db = await getDb();
      const data = await txGet<{
        senderKeyId: number;
        chainKey: string;
        signatureKeyPair: { publicKey: string; privateKey: string };
        iteration: number;
      }>(db, STORES.senderKeys, senderKeyKey(sender, distributionId));
      if (!data) return null;
      return {
        senderKeyId: data.senderKeyId,
        chainKey: fromBase64(data.chainKey),
        signatureKeyPair: deserializeKeyPair(data.signatureKeyPair),
        iteration: data.iteration,
      };
    },

    async deleteSenderKey(sender: ProtocolAddress, distributionId: string): Promise<void> {
      const db = await getDb();
      await txDelete(db, STORES.senderKeys, senderKeyKey(sender, distributionId));
    },

    // ── Skipped Key Store ──

    async loadSkippedKeys(address: ProtocolAddress): Promise<SkippedKey[]> {
      const db = await getDb();
      const data = await txGet<
        Array<{ ratchetPublicKey: string; messageIndex: number; messageKey: string }>
      >(db, STORES.skippedKeys, addressKey(address));
      if (!data) return [];
      return data.map((sk) => ({
        ratchetPublicKey: fromBase64(sk.ratchetPublicKey),
        messageIndex: sk.messageIndex,
        messageKey: fromBase64(sk.messageKey),
      }));
    },

    async storeSkippedKeys(address: ProtocolAddress, keys: SkippedKey[]): Promise<void> {
      const db = await getDb();
      await txPut(
        db,
        STORES.skippedKeys,
        addressKey(address),
        keys.map((sk) => ({
          ratchetPublicKey: toBase64(sk.ratchetPublicKey),
          messageIndex: sk.messageIndex,
          messageKey: toBase64(sk.messageKey),
        })),
      );
    },

    async deleteSkippedKeys(address: ProtocolAddress): Promise<void> {
      const db = await getDb();
      await txDelete(db, STORES.skippedKeys, addressKey(address));
    },
  };
}

// ── Session Serialization ──

function serializeSession(s: SessionState) {
  return {
    rootKey: toBase64(s.rootKey),
    sendingChain: {
      chainKey: toBase64(s.sendingChain.chainKey),
      messageCounter: s.sendingChain.messageCounter,
    },
    receivingChain: s.receivingChain
      ? {
          chainKey: toBase64(s.receivingChain.chainKey),
          messageCounter: s.receivingChain.messageCounter,
        }
      : null,
    localRatchetKeyPair: serializeKeyPair(s.localRatchetKeyPair),
    remoteRatchetPublicKey: toBase64(s.remoteRatchetPublicKey),
    previousSendingChainLength: s.previousSendingChainLength,
    localRegistrationId: s.localRegistrationId,
    remoteRegistrationId: s.remoteRegistrationId,
  };
}

function deserializeSession(data: ReturnType<typeof serializeSession>): SessionState {
  return {
    rootKey: fromBase64(data.rootKey),
    sendingChain: {
      chainKey: fromBase64(data.sendingChain.chainKey),
      messageCounter: data.sendingChain.messageCounter,
    },
    receivingChain: data.receivingChain
      ? {
          chainKey: fromBase64(data.receivingChain.chainKey),
          messageCounter: data.receivingChain.messageCounter,
        }
      : null,
    localRatchetKeyPair: deserializeKeyPair(data.localRatchetKeyPair),
    remoteRatchetPublicKey: fromBase64(data.remoteRatchetPublicKey),
    previousSendingChainLength: data.previousSendingChainLength,
    localRegistrationId: data.localRegistrationId,
    remoteRegistrationId: data.remoteRegistrationId,
  };
}

/**
 * Helper: store identity key pair and registration ID during initial setup.
 */
export async function storeIdentityData(
  store: SignalProtocolStore,
  identityKeyPair: IdentityKeyPair,
  registrationId: number,
): Promise<void> {
  // Access IndexedDB directly for identity setup
  const db = await openDB();
  await txPut(db, STORES.identity, "identityKeyPair", {
    signingKeyPair: serializeKeyPair(identityKeyPair.signingKeyPair),
    dhKeyPair: serializeKeyPair(identityKeyPair.dhKeyPair),
  });
  await txPut(db, STORES.identity, "registrationId", registrationId);
}
