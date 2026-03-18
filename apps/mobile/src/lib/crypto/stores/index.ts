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

function serializeKeyPair(kp: KeyPair): string {
  return JSON.stringify({
    publicKey: toBase64(kp.publicKey),
    privateKey: toBase64(kp.privateKey),
  });
}

function deserializeKeyPair(data: string): KeyPair {
  const parsed = JSON.parse(data) as { publicKey: string; privateKey: string };
  return {
    publicKey: fromBase64(parsed.publicKey),
    privateKey: fromBase64(parsed.privateKey),
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
    const raw = JSON.parse(rows[0].sessionData) as {
      state: SessionRecord['state'];
      version: number;
      pendingPreKey?: { signedPreKeyId: number; baseKey: string; preKeyId?: number };
    };
    // Restore Uint8Array for pendingPreKey.baseKey (stored as base64)
    const record: SessionRecord = {
      state: raw.state,
      version: raw.version,
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

  async storeSession(address: ProtocolAddress, record: SessionRecord): Promise<void> {
    const key = addressKey(address);
    // Convert pendingPreKey.baseKey to base64 for JSON serialization
    const serializable = {
      ...record,
      pendingPreKey: record.pendingPreKey
        ? {
            signedPreKeyId: record.pendingPreKey.signedPreKeyId,
            baseKey: toBase64(record.pendingPreKey.baseKey),
            preKeyId: record.pendingPreKey.preKeyId,
          }
        : undefined,
    };
    const data = JSON.stringify(serializable);

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
    const data = JSON.stringify(record);

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
    return JSON.parse(rows[0].senderKeyData) as SenderKeyRecord;
  }
}

let _store: SqliteSignalStore | null = null;

export function getMobileSignalStore(): SqliteSignalStore {
  if (!_store) {
    _store = new SqliteSignalStore();
  }
  return _store;
}
