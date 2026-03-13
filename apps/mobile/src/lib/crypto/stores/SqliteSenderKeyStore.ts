/**
 * SQLite-backed SenderKeyStore for mobile.
 * Sender key state encrypted at rest.
 */
import { toBase64, fromBase64 } from '@openhospi/crypto';
import type { ProtocolAddress, SenderKeyState, SerializedSenderKeyState } from '@openhospi/crypto';
import type { SenderKeyStore } from '@openhospi/crypto/stores';
import { eq } from 'drizzle-orm';

import { db } from '@/lib/db';
import { senderKeys } from '@/lib/db/schema';

import { encryptValue, decryptValue } from '../crypto-utils';

function compositeKey(sender: ProtocolAddress, distributionId: string): string {
  return `${distributionId}:${sender.name}.${sender.deviceId}`;
}

function serializeKeyPair(kp: { publicKey: Uint8Array; privateKey: Uint8Array }) {
  return { publicKey: toBase64(kp.publicKey), privateKey: toBase64(kp.privateKey) };
}

function deserializeKeyPair(data: { publicKey: string; privateKey: string }) {
  return { publicKey: fromBase64(data.publicKey), privateKey: fromBase64(data.privateKey) };
}

export function createSqliteSenderKeyStore(): SenderKeyStore {
  return {
    async storeSenderKey(
      sender: ProtocolAddress,
      distributionId: string,
      record: SenderKeyState
    ): Promise<void> {
      const key = compositeKey(sender, distributionId);
      const serialized: SerializedSenderKeyState = {
        senderKeyId: record.senderKeyId,
        chainKey: toBase64(record.chainKey),
        signatureKeyPair: serializeKeyPair(record.signatureKeyPair),
        iteration: record.iteration,
      };
      const encrypted = await encryptValue(JSON.stringify(serialized));

      await db
        .insert(senderKeys)
        .values({ compositeKey: key, senderKeyData: encrypted })
        .onConflictDoUpdate({
          target: senderKeys.compositeKey,
          set: { senderKeyData: encrypted, updatedAt: new Date() },
        });
    },

    async loadSenderKey(
      sender: ProtocolAddress,
      distributionId: string
    ): Promise<SenderKeyState | null> {
      const key = compositeKey(sender, distributionId);
      const [row] = await db.select().from(senderKeys).where(eq(senderKeys.compositeKey, key));
      if (!row) return null;

      const decrypted = await decryptValue(row.senderKeyData);
      const data = JSON.parse(decrypted) as SerializedSenderKeyState;

      return {
        senderKeyId: data.senderKeyId,
        chainKey: fromBase64(data.chainKey),
        signatureKeyPair: deserializeKeyPair(data.signatureKeyPair),
        iteration: data.iteration,
      };
    },

    async deleteSenderKey(sender: ProtocolAddress, distributionId: string): Promise<void> {
      await db
        .delete(senderKeys)
        .where(eq(senderKeys.compositeKey, compositeKey(sender, distributionId)));
    },
  };
}
