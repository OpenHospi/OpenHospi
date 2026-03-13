/**
 * SQLite-backed PreKeyStore + SignedPreKeyStore for mobile.
 * Keys stored with encrypted private key material.
 */
import { toBase64, fromBase64 } from '@openhospi/crypto';
import type { OneTimePreKey, SignedPreKey } from '@openhospi/crypto';
import type { PreKeyStore, SignedPreKeyStore } from '@openhospi/crypto/stores';
import { eq, count } from 'drizzle-orm';

import { db } from '@/lib/db';
import { preKeys, signedPreKeys } from '@/lib/db/schema';

import { encryptValue, decryptValue } from '../crypto-utils';

export function createSqlitePreKeyStore(): PreKeyStore & SignedPreKeyStore {
  return {
    // ── Pre Key Store ──

    async loadPreKey(preKeyId: number): Promise<OneTimePreKey> {
      const [row] = await db.select().from(preKeys).where(eq(preKeys.keyId, preKeyId));
      if (!row) throw new Error(`PreKey ${preKeyId} not found`);

      const privateKey = await decryptValue(row.privateKey);

      return {
        keyId: row.keyId,
        keyPair: {
          publicKey: fromBase64(row.publicKey),
          privateKey: fromBase64(privateKey),
        },
      };
    },

    async storePreKey(preKeyId: number, record: OneTimePreKey): Promise<void> {
      const encryptedPrivateKey = await encryptValue(toBase64(record.keyPair.privateKey));

      await db
        .insert(preKeys)
        .values({
          keyId: preKeyId,
          publicKey: toBase64(record.keyPair.publicKey),
          privateKey: encryptedPrivateKey,
          uploaded: false,
        })
        .onConflictDoUpdate({
          target: preKeys.keyId,
          set: {
            publicKey: toBase64(record.keyPair.publicKey),
            privateKey: encryptedPrivateKey,
          },
        });
    },

    async removePreKey(preKeyId: number): Promise<void> {
      await db.delete(preKeys).where(eq(preKeys.keyId, preKeyId));
    },

    async getAvailablePreKeyCount(): Promise<number> {
      const [result] = await db.select({ count: count() }).from(preKeys);
      return result.count;
    },

    // ── Signed Pre Key Store ──

    async loadSignedPreKey(signedPreKeyId: number): Promise<SignedPreKey> {
      const [row] = await db
        .select()
        .from(signedPreKeys)
        .where(eq(signedPreKeys.keyId, signedPreKeyId));
      if (!row) throw new Error(`SignedPreKey ${signedPreKeyId} not found`);

      const privateKey = await decryptValue(row.privateKey);

      return {
        keyId: row.keyId,
        keyPair: {
          publicKey: fromBase64(row.publicKey),
          privateKey: fromBase64(privateKey),
        },
        signature: fromBase64(row.signature),
      };
    },

    async storeSignedPreKey(signedPreKeyId: number, record: SignedPreKey): Promise<void> {
      const encryptedPrivateKey = await encryptValue(toBase64(record.keyPair.privateKey));

      await db
        .insert(signedPreKeys)
        .values({
          keyId: signedPreKeyId,
          publicKey: toBase64(record.keyPair.publicKey),
          privateKey: encryptedPrivateKey,
          signature: toBase64(record.signature),
        })
        .onConflictDoUpdate({
          target: signedPreKeys.keyId,
          set: {
            publicKey: toBase64(record.keyPair.publicKey),
            privateKey: encryptedPrivateKey,
            signature: toBase64(record.signature),
          },
        });
    },
  };
}
