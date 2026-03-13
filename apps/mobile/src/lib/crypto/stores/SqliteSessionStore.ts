/**
 * SQLite-backed SessionStore + SkippedKeyStore for mobile.
 * Session state and skipped keys are encrypted at rest.
 */
import { toBase64, fromBase64 } from '@openhospi/crypto';
import type {
  ProtocolAddress,
  SessionState,
  SkippedKey,
  SerializedSessionState,
} from '@openhospi/crypto';
import type { SessionStore, SkippedKeyStore } from '@openhospi/crypto/stores';
import { eq, like } from 'drizzle-orm';

import { db } from '@/lib/db';
import { sessions, skippedKeys } from '@/lib/db/schema';

import { encryptValue, decryptValue } from '../crypto-utils';

function addressKey(addr: ProtocolAddress): string {
  return `${addr.name}.${addr.deviceId}`;
}

function serializeKeyPair(kp: { publicKey: Uint8Array; privateKey: Uint8Array }) {
  return { publicKey: toBase64(kp.publicKey), privateKey: toBase64(kp.privateKey) };
}

function deserializeKeyPair(data: { publicKey: string; privateKey: string }) {
  return { publicKey: fromBase64(data.publicKey), privateKey: fromBase64(data.privateKey) };
}

function serializeSession(s: SessionState): SerializedSessionState {
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

function deserializeSession(data: SerializedSessionState): SessionState {
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

export function createSqliteSessionStore(): SessionStore & SkippedKeyStore {
  return {
    // ── Session Store ──

    async loadSession(address: ProtocolAddress): Promise<SessionState | null> {
      const key = addressKey(address);
      const [row] = await db.select().from(sessions).where(eq(sessions.address, key));
      if (!row) return null;

      const decrypted = await decryptValue(row.sessionData);
      return deserializeSession(JSON.parse(decrypted) as SerializedSessionState);
    },

    async storeSession(address: ProtocolAddress, record: SessionState): Promise<void> {
      const key = addressKey(address);
      const serialized = JSON.stringify(serializeSession(record));
      const encrypted = await encryptValue(serialized);

      await db
        .insert(sessions)
        .values({ address: key, sessionData: encrypted })
        .onConflictDoUpdate({
          target: sessions.address,
          set: { sessionData: encrypted, updatedAt: new Date() },
        });
    },

    async deleteSession(address: ProtocolAddress): Promise<void> {
      await db.delete(sessions).where(eq(sessions.address, addressKey(address)));
    },

    async getSubDeviceSessions(userId: string): Promise<number[]> {
      const prefix = `${userId}.`;
      const rows = await db
        .select({ address: sessions.address })
        .from(sessions)
        .where(like(sessions.address, `${prefix}%`));

      return rows.map((r) => parseInt(r.address.slice(prefix.length), 10)).filter((n) => !isNaN(n));
    },

    // ── Skipped Key Store ──

    async loadSkippedKeys(address: ProtocolAddress): Promise<SkippedKey[]> {
      const key = addressKey(address);
      const rows = await db.select().from(skippedKeys).where(eq(skippedKeys.address, key));

      const result: SkippedKey[] = [];
      for (const row of rows) {
        const decryptedKey = await decryptValue(row.messageKey);
        result.push({
          ratchetPublicKey: fromBase64(key), // stored as address, actual ratchet key in messageKey
          messageIndex: row.messageIndex,
          messageKey: fromBase64(decryptedKey),
        });
      }
      return result;
    },

    async storeSkippedKeys(address: ProtocolAddress, keys: SkippedKey[]): Promise<void> {
      const addr = addressKey(address);

      // Replace all skipped keys for this address
      await db.delete(skippedKeys).where(eq(skippedKeys.address, addr));

      for (const sk of keys) {
        const encryptedKey = await encryptValue(toBase64(sk.messageKey));
        await db.insert(skippedKeys).values({
          address: addr,
          messageIndex: sk.messageIndex,
          messageKey: encryptedKey,
        });
      }
    },

    async deleteSkippedKeys(address: ProtocolAddress): Promise<void> {
      await db.delete(skippedKeys).where(eq(skippedKeys.address, addressKey(address)));
    },
  };
}
