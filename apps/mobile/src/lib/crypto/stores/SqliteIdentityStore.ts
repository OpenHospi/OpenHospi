/**
 * SQLite-backed IdentityKeyStore for mobile.
 * Identity key pair stored in `identityKeys` table with encrypted private keys.
 * Remote identities stored in `encryptedStore` via key prefix.
 */
import { toBase64, fromBase64 } from '@openhospi/crypto';
import type { IdentityKeyPair, ProtocolAddress } from '@openhospi/crypto';
import type { IdentityKeyStore } from '@openhospi/crypto/stores';
import { eq } from 'drizzle-orm';

import { db } from '@/lib/db';
import { identityKeys, encryptedStore } from '@/lib/db/schema';

import { encryptValue, decryptValue } from '../crypto-utils';

function remoteIdentityKey(addr: ProtocolAddress): string {
  return `remoteIdentity:${addr.name}.${addr.deviceId}`;
}

export function createSqliteIdentityStore(): IdentityKeyStore & {
  storeIdentityKeyPair(identity: IdentityKeyPair, registrationId: number): Promise<void>;
} {
  return {
    async getIdentityKeyPair(): Promise<IdentityKeyPair> {
      const [row] = await db.select().from(identityKeys).limit(1);
      if (!row) throw new Error('Identity key pair not found');

      const privateData = await decryptValue(row.privateKey);
      const parsed = JSON.parse(privateData) as {
        signingPrivateKey: string;
        dhPrivateKey: string;
      };
      const publicData = JSON.parse(row.publicKey) as {
        signingPublicKey: string;
        dhPublicKey: string;
      };

      return {
        signingKeyPair: {
          publicKey: fromBase64(publicData.signingPublicKey),
          privateKey: fromBase64(parsed.signingPrivateKey),
        },
        dhKeyPair: {
          publicKey: fromBase64(publicData.dhPublicKey),
          privateKey: fromBase64(parsed.dhPrivateKey),
        },
      };
    },

    async getLocalRegistrationId(): Promise<number> {
      const [row] = await db.select().from(identityKeys).limit(1);
      if (!row) throw new Error('Registration ID not found');
      return row.registrationId;
    },

    async saveIdentity(address: ProtocolAddress, identityKey: Uint8Array): Promise<boolean> {
      const key = remoteIdentityKey(address);
      const encoded = toBase64(identityKey);

      const [existing] = await db.select().from(encryptedStore).where(eq(encryptedStore.key, key));

      await db
        .insert(encryptedStore)
        .values({ key, value: encoded, updatedAt: new Date() })
        .onConflictDoUpdate({
          target: encryptedStore.key,
          set: { value: encoded, updatedAt: new Date() },
        });

      return existing !== undefined && existing.value !== encoded;
    },

    async isTrustedIdentity(address: ProtocolAddress, identityKey: Uint8Array): Promise<boolean> {
      const key = remoteIdentityKey(address);
      const [existing] = await db.select().from(encryptedStore).where(eq(encryptedStore.key, key));
      if (!existing) return true; // trust on first use
      return existing.value === toBase64(identityKey);
    },

    async storeIdentityKeyPair(identity: IdentityKeyPair, registrationId: number): Promise<void> {
      const publicData = JSON.stringify({
        signingPublicKey: toBase64(identity.signingKeyPair.publicKey),
        dhPublicKey: toBase64(identity.dhKeyPair.publicKey),
      });
      const privateData = await encryptValue(
        JSON.stringify({
          signingPrivateKey: toBase64(identity.signingKeyPair.privateKey),
          dhPrivateKey: toBase64(identity.dhKeyPair.privateKey),
        })
      );

      // Clear existing and insert new
      await db.delete(identityKeys);
      await db.insert(identityKeys).values({
        registrationId,
        publicKey: publicData,
        privateKey: privateData,
      });
    },
  };
}
