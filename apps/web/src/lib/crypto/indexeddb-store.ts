import type {
  KeyPair,
  PreKeyRecord,
  ProtocolAddress,
  SenderKeyRecord,
  SessionRecord,
  SignalProtocolStore,
  SignedPreKeyRecord,
} from "@openhospi/crypto";

const DB_NAME = "openhospi-signal";
const DB_VERSION = 1;

const STORES = {
  identity: "identity",
  preKeys: "preKeys",
  signedPreKeys: "signedPreKeys",
  sessions: "sessions",
  senderKeys: "senderKeys",
  trustedIdentities: "trustedIdentities",
} as const;

function addressKey(addr: ProtocolAddress): string {
  return `${addr.userId}:${addr.deviceId}`;
}

function senderKeyId(addr: ProtocolAddress, distId: string): string {
  return `${addressKey(addr)}:${distId}`;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      for (const name of Object.values(STORES)) {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name);
        }
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function idbGet<T>(store: string, key: string): Promise<T | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

async function idbPut(store: string, key: string, value: unknown): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbDelete(store: string, key: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbGetAllKeys(store: string): Promise<string[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).getAllKeys();
    req.onsuccess = () => resolve(req.result as string[]);
    req.onerror = () => reject(req.error);
  });
}

async function idbCount(store: string): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).count();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// Serialisation helpers — Uint8Array → number array for JSON-safe IDB storage

function serializeKeyPair(kp: KeyPair): { publicKey: number[]; privateKey: number[] } {
  return { publicKey: Array.from(kp.publicKey), privateKey: Array.from(kp.privateKey) };
}

function deserializeKeyPair(data: { publicKey: number[]; privateKey: number[] }): KeyPair {
  return {
    publicKey: new Uint8Array(data.publicKey),
    privateKey: new Uint8Array(data.privateKey),
  };
}

function serializeSession(record: SessionRecord): unknown {
  const state = record.state;
  return {
    version: record.version,
    pendingPreKey: record.pendingPreKey
      ? {
          signedPreKeyId: record.pendingPreKey.signedPreKeyId,
          baseKey: Array.from(record.pendingPreKey.baseKey),
          preKeyId: record.pendingPreKey.preKeyId,
        }
      : undefined,
    state: {
      rootKey: Array.from(state.rootKey),
      sendingChainKey: state.sendingChainKey ? Array.from(state.sendingChainKey) : null,
      receivingChainKey: state.receivingChainKey ? Array.from(state.receivingChainKey) : null,
      sendingRatchetKey: state.sendingRatchetKey ? serializeKeyPair(state.sendingRatchetKey) : null,
      receivingRatchetKey: state.receivingRatchetKey ? Array.from(state.receivingRatchetKey) : null,
      sendingCounter: state.sendingCounter,
      receivingCounter: state.receivingCounter,
      previousSendingCounter: state.previousSendingCounter,
      skippedKeys: Object.fromEntries(
        Array.from(state.skippedKeys.entries()).map(([k, v]) => [k, Array.from(v)]),
      ),
      remoteIdentityKey: Array.from(state.remoteIdentityKey),
      localIdentityKey: Array.from(state.localIdentityKey),
    },
  };
}

function deserializeSession(data: ReturnType<typeof serializeSession>): SessionRecord {
  const raw = data as {
    version: number;
    pendingPreKey?: {
      signedPreKeyId: number;
      baseKey: number[];
      preKeyId?: number;
    };
    state: {
      rootKey: number[];
      sendingChainKey: number[] | null;
      receivingChainKey: number[] | null;
      sendingRatchetKey: { publicKey: number[]; privateKey: number[] } | null;
      receivingRatchetKey: number[] | null;
      sendingCounter: number;
      receivingCounter: number;
      previousSendingCounter: number;
      skippedKeys: Record<string, number[]>;
      remoteIdentityKey: number[];
      localIdentityKey: number[];
    };
  };

  return {
    version: raw.version,
    pendingPreKey: raw.pendingPreKey
      ? {
          signedPreKeyId: raw.pendingPreKey.signedPreKeyId,
          baseKey: new Uint8Array(raw.pendingPreKey.baseKey),
          preKeyId: raw.pendingPreKey.preKeyId,
        }
      : undefined,
    state: {
      rootKey: new Uint8Array(raw.state.rootKey),
      sendingChainKey: raw.state.sendingChainKey ? new Uint8Array(raw.state.sendingChainKey) : null,
      receivingChainKey: raw.state.receivingChainKey
        ? new Uint8Array(raw.state.receivingChainKey)
        : null,
      sendingRatchetKey: raw.state.sendingRatchetKey
        ? deserializeKeyPair(raw.state.sendingRatchetKey)
        : null,
      receivingRatchetKey: raw.state.receivingRatchetKey
        ? new Uint8Array(raw.state.receivingRatchetKey)
        : null,
      sendingCounter: raw.state.sendingCounter,
      receivingCounter: raw.state.receivingCounter,
      previousSendingCounter: raw.state.previousSendingCounter,
      skippedKeys: new Map(
        Object.entries(raw.state.skippedKeys).map(([k, v]) => [k, new Uint8Array(v)]),
      ),
      remoteIdentityKey: new Uint8Array(raw.state.remoteIdentityKey),
      localIdentityKey: new Uint8Array(raw.state.localIdentityKey),
    },
  };
}

/**
 * IndexedDB-backed implementation of the full Signal Protocol store.
 * Used by the web client for local key/session/sender-key persistence.
 */
export class IndexedDBSignalStore implements SignalProtocolStore {
  // ── IdentityKeyStore ──

  async getIdentityKeyPair(): Promise<KeyPair> {
    const data = await idbGet<{ publicKey: number[]; privateKey: number[] }>(
      STORES.identity,
      "dhKeyPair",
    );
    if (!data) throw new Error("Identity key pair not found. Call setupDevice first.");
    return deserializeKeyPair(data);
  }

  async getSigningKeyPair(): Promise<KeyPair> {
    const data = await idbGet<{ publicKey: number[]; privateKey: number[] }>(
      STORES.identity,
      "signingKeyPair",
    );
    if (!data) throw new Error("Signing key pair not found. Call setupDevice first.");
    return deserializeKeyPair(data);
  }

  async getLocalRegistrationId(): Promise<number> {
    const id = await idbGet<number>(STORES.identity, "registrationId");
    if (id === undefined) throw new Error("Registration ID not found.");
    return id;
  }

  async setIdentityKeyPair(dhKeyPair: KeyPair, signingKeyPair: KeyPair): Promise<void> {
    await idbPut(STORES.identity, "dhKeyPair", serializeKeyPair(dhKeyPair));
    await idbPut(STORES.identity, "signingKeyPair", serializeKeyPair(signingKeyPair));
  }

  async setLocalRegistrationId(id: number): Promise<void> {
    await idbPut(STORES.identity, "registrationId", id);
  }

  async saveIdentity(address: ProtocolAddress, identityKey: Uint8Array): Promise<boolean> {
    const key = addressKey(address);
    const existing = await idbGet<number[]>(STORES.trustedIdentities, key);

    if (existing) {
      const existingKey = new Uint8Array(existing);
      const changed = !arraysEqual(existingKey, identityKey);
      if (changed) {
        await idbPut(STORES.trustedIdentities, key, Array.from(identityKey));
      }
      return changed;
    }

    await idbPut(STORES.trustedIdentities, key, Array.from(identityKey));
    return false;
  }

  async isTrustedIdentity(address: ProtocolAddress, identityKey: Uint8Array): Promise<boolean> {
    const existing = await idbGet<number[]>(STORES.trustedIdentities, addressKey(address));
    if (!existing) return true; // Trust on first use (TOFU)
    return arraysEqual(new Uint8Array(existing), identityKey);
  }

  async getIdentity(address: ProtocolAddress): Promise<Uint8Array | null> {
    const data = await idbGet<number[]>(STORES.trustedIdentities, addressKey(address));
    return data ? new Uint8Array(data) : null;
  }

  // ── PreKeyStore ──

  async loadPreKey(preKeyId: number): Promise<PreKeyRecord> {
    const data = await idbGet<{
      keyId: number;
      keyPair: { publicKey: number[]; privateKey: number[] };
    }>(STORES.preKeys, String(preKeyId));
    if (!data) throw new Error(`PreKey ${preKeyId} not found`);
    return { keyId: data.keyId, keyPair: deserializeKeyPair(data.keyPair) };
  }

  async storePreKey(preKeyId: number, record: PreKeyRecord): Promise<void> {
    await idbPut(STORES.preKeys, String(preKeyId), {
      keyId: record.keyId,
      keyPair: serializeKeyPair(record.keyPair),
    });
  }

  async removePreKey(preKeyId: number): Promise<void> {
    await idbDelete(STORES.preKeys, String(preKeyId));
  }

  async getAvailablePreKeyCount(): Promise<number> {
    return idbCount(STORES.preKeys);
  }

  async getMaxPreKeyId(): Promise<number> {
    const allKeys = await idbGetAllKeys(STORES.preKeys);
    if (allKeys.length === 0) return 0;
    return Math.max(...allKeys.map(Number));
  }

  // ── SignedPreKeyStore ──

  async loadSignedPreKey(signedPreKeyId: number): Promise<SignedPreKeyRecord> {
    const data = await idbGet<{
      keyId: number;
      keyPair: { publicKey: number[]; privateKey: number[] };
      signature: number[];
      timestamp: number;
    }>(STORES.signedPreKeys, String(signedPreKeyId));
    if (!data) throw new Error(`SignedPreKey ${signedPreKeyId} not found`);
    return {
      keyId: data.keyId,
      keyPair: deserializeKeyPair(data.keyPair),
      signature: new Uint8Array(data.signature),
      timestamp: data.timestamp,
    };
  }

  async storeSignedPreKey(signedPreKeyId: number, record: SignedPreKeyRecord): Promise<void> {
    await idbPut(STORES.signedPreKeys, String(signedPreKeyId), {
      keyId: record.keyId,
      keyPair: serializeKeyPair(record.keyPair),
      signature: Array.from(record.signature),
      timestamp: record.timestamp,
    });
  }

  // ── SessionStore ──

  async loadSession(address: ProtocolAddress): Promise<SessionRecord | null> {
    const data = await idbGet(STORES.sessions, addressKey(address));
    if (!data) return null;
    return deserializeSession(data);
  }

  async storeSession(address: ProtocolAddress, record: SessionRecord): Promise<void> {
    await idbPut(STORES.sessions, addressKey(address), serializeSession(record));
  }

  async getSubDeviceSessions(userId: string): Promise<number[]> {
    const allKeys = await idbGetAllKeys(STORES.sessions);
    const prefix = `${userId}:`;
    return allKeys.filter((k) => k.startsWith(prefix)).map((k) => Number(k.slice(prefix.length)));
  }

  // ── SenderKeyStore ──

  async storeSenderKey(
    sender: ProtocolAddress,
    distributionId: string,
    record: SenderKeyRecord,
  ): Promise<void> {
    const key = senderKeyId(sender, distributionId);
    await idbPut(STORES.senderKeys, key, {
      state: {
        chainKey: Array.from(record.state.chainKey),
        iteration: record.state.iteration,
        signingKeyPair: serializeKeyPair(record.state.signingKeyPair),
        messageKeys: Array.from(record.state.messageKeys.entries()).map(([k, v]) => [
          k,
          Array.from(v),
        ]),
      },
    });
  }

  async loadSenderKey(
    sender: ProtocolAddress,
    distributionId: string,
  ): Promise<SenderKeyRecord | null> {
    const data = await idbGet<{
      state: {
        chainKey: number[];
        iteration: number;
        signingKeyPair: { publicKey: number[]; privateKey: number[] };
        messageKeys?: Array<[number, number[]]>;
      };
    }>(STORES.senderKeys, senderKeyId(sender, distributionId));

    if (!data) return null;

    return {
      state: {
        chainKey: new Uint8Array(data.state.chainKey),
        iteration: data.state.iteration,
        signingKeyPair: deserializeKeyPair(data.state.signingKeyPair),
        messageKeys: data.state.messageKeys
          ? new Map(data.state.messageKeys.map(([k, v]) => [k, new Uint8Array(v)]))
          : new Map(),
      },
    };
  }

  // ── Utility ──

  async hasIdentityKey(): Promise<boolean> {
    const data = await idbGet(STORES.identity, "dhKeyPair");
    return !!data;
  }
}

function arraysEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
