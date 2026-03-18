import type {
  KeyPair,
  PreKeyRecord,
  ProtocolAddress,
  SenderKeyRecord,
  SessionRecord,
  SignalProtocolStore,
  SignedPreKeyRecord,
} from '@openhospi/crypto';
import { fromBase64, toBase64 } from '@openhospi/crypto';
import { eq } from 'drizzle-orm';

import { db } from '@/lib/db';
import {
  identityKeys,
  preKeys,
  senderKeys,
  sessions,
  signedPreKeys,
  trustedIdentities,
} from '@/lib/db/schema';

function addressKey(addr: ProtocolAddress): string {
  return `${addr.userId}:${addr.deviceId}`;
}

function senderKeyComposite(addr: ProtocolAddress, distId: string): string {
  return `${distId}:${addressKey(addr)}`;
}

// ── Session serialization (Uint8Array <-> base64 for JSON round-trip) ──

type SerializedKeyPair = { publicKey: string; privateKey: string };
type SerializedSessionState = {
  rootKey: string;
  sendingChainKey: string | null;
  receivingChainKey: string | null;
  sendingRatchetKey: SerializedKeyPair | null;
  receivingRatchetKey: string | null;
  sendingCounter: number;
  receivingCounter: number;
  previousSendingCounter: number;
  skippedKeys: Record<string, string>;
  remoteIdentityKey: string;
  localIdentityKey: string;
};
type SerializedSession = {
  version: number;
  pendingPreKey?: { signedPreKeyId: number; baseKey: string; preKeyId?: number };
  state: SerializedSessionState;
};
type SerializedSenderKey = {
  state: {
    chainKey: string;
    iteration: number;
    signingKeyPair: SerializedKeyPair;
  };
};

function serializeSessionRecord(record: SessionRecord): string {
  const s = record.state;
  const serialized: SerializedSession = {
    version: record.version,
    pendingPreKey: record.pendingPreKey
      ? {
          signedPreKeyId: record.pendingPreKey.signedPreKeyId,
          baseKey: toBase64(record.pendingPreKey.baseKey),
          preKeyId: record.pendingPreKey.preKeyId,
        }
      : undefined,
    state: {
      rootKey: toBase64(s.rootKey),
      sendingChainKey: s.sendingChainKey ? toBase64(s.sendingChainKey) : null,
      receivingChainKey: s.receivingChainKey ? toBase64(s.receivingChainKey) : null,
      sendingRatchetKey: s.sendingRatchetKey
        ? {
            publicKey: toBase64(s.sendingRatchetKey.publicKey),
            privateKey: toBase64(s.sendingRatchetKey.privateKey),
          }
        : null,
      receivingRatchetKey: s.receivingRatchetKey ? toBase64(s.receivingRatchetKey) : null,
      sendingCounter: s.sendingCounter,
      receivingCounter: s.receivingCounter,
      previousSendingCounter: s.previousSendingCounter,
      skippedKeys: Object.fromEntries(
        Array.from(s.skippedKeys.entries()).map(([k, v]) => [k, toBase64(v)])
      ),
      remoteIdentityKey: toBase64(s.remoteIdentityKey),
      localIdentityKey: toBase64(s.localIdentityKey),
    },
  };
  return JSON.stringify(serialized);
}

function deserializeSessionRecord(data: string): SessionRecord {
  const raw = JSON.parse(data) as SerializedSession;
  const s = raw.state;
  const record: SessionRecord = {
    version: raw.version,
    state: {
      rootKey: fromBase64(s.rootKey),
      sendingChainKey: s.sendingChainKey ? fromBase64(s.sendingChainKey) : null,
      receivingChainKey: s.receivingChainKey ? fromBase64(s.receivingChainKey) : null,
      sendingRatchetKey: s.sendingRatchetKey
        ? {
            publicKey: fromBase64(s.sendingRatchetKey.publicKey),
            privateKey: fromBase64(s.sendingRatchetKey.privateKey),
          }
        : null,
      receivingRatchetKey: s.receivingRatchetKey ? fromBase64(s.receivingRatchetKey) : null,
      sendingCounter: s.sendingCounter,
      receivingCounter: s.receivingCounter,
      previousSendingCounter: s.previousSendingCounter,
      skippedKeys: new Map(Object.entries(s.skippedKeys).map(([k, v]) => [k, fromBase64(v)])),
      remoteIdentityKey: fromBase64(s.remoteIdentityKey),
      localIdentityKey: fromBase64(s.localIdentityKey),
    },
  };
  if (raw.pendingPreKey?.baseKey) {
    record.pendingPreKey = {
      signedPreKeyId: raw.pendingPreKey.signedPreKeyId,
      baseKey: fromBase64(raw.pendingPreKey.baseKey),
      preKeyId: raw.pendingPreKey.preKeyId,
    };
  }
  return record;
}

function serializeSenderKeyRecord(record: SenderKeyRecord): string {
  return JSON.stringify({
    state: {
      chainKey: toBase64(record.state.chainKey),
      iteration: record.state.iteration,
      signingKeyPair: {
        publicKey: toBase64(record.state.signingKeyPair.publicKey),
        privateKey: toBase64(record.state.signingKeyPair.privateKey),
      },
    },
  } satisfies SerializedSenderKey);
}

function deserializeSenderKeyRecord(data: string): SenderKeyRecord {
  const raw = JSON.parse(data) as SerializedSenderKey;
  return {
    state: {
      chainKey: fromBase64(raw.state.chainKey),
      iteration: raw.state.iteration,
      signingKeyPair: {
        publicKey: fromBase64(raw.state.signingKeyPair.publicKey),
        privateKey: fromBase64(raw.state.signingKeyPair.privateKey),
      },
    },
  };
}

/**
 * SQLite-backed Signal Protocol store for React Native / Expo.
 * All private key material is base64-encoded in SQLite.
 * For production, consider encrypting with a key from expo-secure-store.
 */
class SqliteSignalStore implements SignalProtocolStore {
  // ── IdentityKeyStore ──

  async getIdentityKeyPair(): Promise<KeyPair> {
    const rows = db.select().from(identityKeys).limit(1).all();
    if (rows.length === 0) throw new Error('Identity key pair not found');
    return {
      publicKey: fromBase64(rows[0].publicKey),
      privateKey: fromBase64(rows[0].privateKey),
    };
  }

  async getSigningKeyPair(): Promise<KeyPair> {
    const rows = db.select().from(identityKeys).limit(1).all();
    if (rows.length === 0) throw new Error('Signing key pair not found');
    const row = rows[0];
    if (!row.signingPublicKey || !row.signingPrivateKey) {
      throw new Error('Signing key pair not stored. Re-initialize device.');
    }
    return {
      publicKey: fromBase64(row.signingPublicKey),
      privateKey: fromBase64(row.signingPrivateKey),
    };
  }

  async getLocalRegistrationId(): Promise<number> {
    const rows = db.select().from(identityKeys).limit(1).all();
    if (rows.length === 0) throw new Error('Registration ID not found');
    return rows[0].registrationId;
  }

  async setIdentityKeyPair(dhKeyPair: KeyPair, signingKeyPair: KeyPair): Promise<void> {
    // Clear existing and insert new
    db.delete(identityKeys).run();
    db.insert(identityKeys)
      .values({
        registrationId: 0, // Will be set via setLocalRegistrationId
        publicKey: toBase64(dhKeyPair.publicKey),
        privateKey: toBase64(dhKeyPair.privateKey),
        signingPublicKey: toBase64(signingKeyPair.publicKey),
        signingPrivateKey: toBase64(signingKeyPair.privateKey),
      })
      .run();
  }

  async setLocalRegistrationId(id: number): Promise<void> {
    const rows = db.select().from(identityKeys).limit(1).all();
    if (rows.length > 0) {
      db.update(identityKeys).set({ registrationId: id }).run();
    }
  }

  async saveIdentity(address: ProtocolAddress, identityKey: Uint8Array): Promise<boolean> {
    const key = addressKey(address);
    const encoded = toBase64(identityKey);
    const rows = db
      .select()
      .from(trustedIdentities)
      .where(eq(trustedIdentities.address, key))
      .all();

    if (rows.length > 0) {
      const changed = rows[0].identityKey !== encoded;
      if (changed) {
        db.update(trustedIdentities)
          .set({ identityKey: encoded })
          .where(eq(trustedIdentities.address, key))
          .run();
      }
      return changed;
    }

    db.insert(trustedIdentities).values({ address: key, identityKey: encoded }).run();
    return false;
  }

  async isTrustedIdentity(address: ProtocolAddress, identityKey: Uint8Array): Promise<boolean> {
    const key = addressKey(address);
    const rows = db
      .select()
      .from(trustedIdentities)
      .where(eq(trustedIdentities.address, key))
      .all();
    if (rows.length === 0) return true; // TOFU
    return rows[0].identityKey === toBase64(identityKey);
  }

  async getIdentity(address: ProtocolAddress): Promise<Uint8Array | null> {
    const key = addressKey(address);
    const rows = db
      .select()
      .from(trustedIdentities)
      .where(eq(trustedIdentities.address, key))
      .all();
    if (rows.length === 0) return null;
    return fromBase64(rows[0].identityKey);
  }

  // ── PreKeyStore ──

  async loadPreKey(preKeyId: number): Promise<PreKeyRecord> {
    const rows = db.select().from(preKeys).where(eq(preKeys.keyId, preKeyId)).all();
    if (rows.length === 0) throw new Error(`PreKey ${preKeyId} not found`);
    const row = rows[0];
    return {
      keyId: row.keyId,
      keyPair: {
        publicKey: fromBase64(row.publicKey),
        privateKey: fromBase64(row.privateKey),
      },
    };
  }

  async storePreKey(preKeyId: number, record: PreKeyRecord): Promise<void> {
    db.insert(preKeys)
      .values({
        keyId: preKeyId,
        publicKey: toBase64(record.keyPair.publicKey),
        privateKey: toBase64(record.keyPair.privateKey),
      })
      .onConflictDoUpdate({
        target: preKeys.keyId,
        set: {
          publicKey: toBase64(record.keyPair.publicKey),
          privateKey: toBase64(record.keyPair.privateKey),
        },
      })
      .run();
  }

  async removePreKey(preKeyId: number): Promise<void> {
    db.delete(preKeys).where(eq(preKeys.keyId, preKeyId)).run();
  }

  async getAvailablePreKeyCount(): Promise<number> {
    const rows = db.select().from(preKeys).all();
    return rows.length;
  }

  async getMaxPreKeyId(): Promise<number> {
    const rows = db.select({ keyId: preKeys.keyId }).from(preKeys).all();
    if (rows.length === 0) return 0;
    return Math.max(...rows.map((r) => r.keyId));
  }

  // ── SignedPreKeyStore ──

  async loadSignedPreKey(signedPreKeyId: number): Promise<SignedPreKeyRecord> {
    const rows = db
      .select()
      .from(signedPreKeys)
      .where(eq(signedPreKeys.keyId, signedPreKeyId))
      .all();
    if (rows.length === 0) throw new Error(`SignedPreKey ${signedPreKeyId} not found`);
    const row = rows[0];
    return {
      keyId: row.keyId,
      keyPair: {
        publicKey: fromBase64(row.publicKey),
        privateKey: fromBase64(row.privateKey),
      },
      signature: fromBase64(row.signature),
      timestamp: row.createdAt.getTime(),
    };
  }

  async storeSignedPreKey(signedPreKeyId: number, record: SignedPreKeyRecord): Promise<void> {
    db.insert(signedPreKeys)
      .values({
        keyId: signedPreKeyId,
        publicKey: toBase64(record.keyPair.publicKey),
        privateKey: toBase64(record.keyPair.privateKey),
        signature: toBase64(record.signature),
      })
      .onConflictDoUpdate({
        target: signedPreKeys.keyId,
        set: {
          publicKey: toBase64(record.keyPair.publicKey),
          privateKey: toBase64(record.keyPair.privateKey),
          signature: toBase64(record.signature),
        },
      })
      .run();
  }

  // ── SessionStore ──

  async loadSession(address: ProtocolAddress): Promise<SessionRecord | null> {
    const key = addressKey(address);
    const rows = db.select().from(sessions).where(eq(sessions.address, key)).all();
    if (rows.length === 0) return null;
    return deserializeSessionRecord(rows[0].sessionData);
  }

  async storeSession(address: ProtocolAddress, record: SessionRecord): Promise<void> {
    const key = addressKey(address);
    const data = serializeSessionRecord(record);

    db.insert(sessions)
      .values({ address: key, sessionData: data })
      .onConflictDoUpdate({
        target: sessions.address,
        set: { sessionData: data, updatedAt: new Date() },
      })
      .run();
  }

  async getSubDeviceSessions(userId: string): Promise<number[]> {
    const prefix = `${userId}:`;
    const rows = db.select().from(sessions).all();
    return rows
      .filter((r) => r.address.startsWith(prefix))
      .map((r) => Number(r.address.slice(prefix.length)));
  }

  // ── SenderKeyStore ──

  async storeSenderKey(
    sender: ProtocolAddress,
    distributionId: string,
    record: SenderKeyRecord
  ): Promise<void> {
    const key = senderKeyComposite(sender, distributionId);
    const data = serializeSenderKeyRecord(record);

    db.insert(senderKeys)
      .values({ compositeKey: key, senderKeyData: data })
      .onConflictDoUpdate({
        target: senderKeys.compositeKey,
        set: { senderKeyData: data, updatedAt: new Date() },
      })
      .run();
  }

  async loadSenderKey(
    sender: ProtocolAddress,
    distributionId: string
  ): Promise<SenderKeyRecord | null> {
    const key = senderKeyComposite(sender, distributionId);
    const rows = db.select().from(senderKeys).where(eq(senderKeys.compositeKey, key)).all();
    if (rows.length === 0) return null;
    return deserializeSenderKeyRecord(rows[0].senderKeyData);
  }
}

let _store: SqliteSignalStore | null = null;

export function getMobileSignalStore(): SqliteSignalStore {
  if (!_store) {
    _store = new SqliteSignalStore();
  }
  return _store;
}
