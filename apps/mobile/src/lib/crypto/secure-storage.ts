/**
 * Encrypted key-value store backed by SQLite + master key from expo-secure-store.
 * Used for general encrypted storage (sent message cache, etc.).
 * Signal protocol stores use dedicated SQLite tables instead.
 */
import { eq, like } from 'drizzle-orm';

import { db } from '@/lib/db';
import { encryptedStore } from '@/lib/db/schema';

import { getMasterKey, encryptData, decryptData } from './crypto-utils';

export const SecureStorage = {
  async set(key: string, value: string): Promise<void> {
    const masterKey = await getMasterKey();
    const encrypted = encryptData(masterKey, value);
    const blob = JSON.stringify(encrypted);
    await db
      .insert(encryptedStore)
      .values({ key, value: blob, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: encryptedStore.key,
        set: { value: blob, updatedAt: new Date() },
      });
  },

  async get(key: string): Promise<string | null> {
    const [row] = await db.select().from(encryptedStore).where(eq(encryptedStore.key, key));
    if (!row) return null;
    const masterKey = await getMasterKey();
    const payload = JSON.parse(row.value) as { iv: string; content: string };
    return decryptData(masterKey, payload);
  },

  async delete(key: string): Promise<void> {
    await db.delete(encryptedStore).where(eq(encryptedStore.key, key));
  },

  async deleteByPrefix(prefix: string): Promise<void> {
    await db.delete(encryptedStore).where(like(encryptedStore.key, `${prefix}%`));
  },

  async clear(): Promise<void> {
    await db.delete(encryptedStore);
  },
};
