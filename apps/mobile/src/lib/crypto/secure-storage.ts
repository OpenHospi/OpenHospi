import * as SecureStore from 'expo-secure-store';
import { eq, like } from 'drizzle-orm';

import { db } from '@/lib/db';
import { encryptedStore } from '@/lib/db/schema';

// react-native-quick-crypto is already installed and polyfilled in _layout.tsx
// eslint-disable-next-line @typescript-eslint/no-require-imports
const QuickCrypto = require('react-native-quick-crypto');

const MASTER_KEY_ID = 'openhospi_master_key';

let cachedMasterKey: Buffer | null = null;

async function getMasterKey(): Promise<Buffer> {
  if (cachedMasterKey) return cachedMasterKey;

  const stored = await SecureStore.getItemAsync(MASTER_KEY_ID);
  if (stored) {
    cachedMasterKey = Buffer.from(stored, 'base64');
    return cachedMasterKey;
  }

  const key: Buffer = QuickCrypto.randomBytes(32);
  await SecureStore.setItemAsync(MASTER_KEY_ID, Buffer.from(key).toString('base64'), {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  cachedMasterKey = Buffer.from(key);
  return cachedMasterKey;
}

function encryptData(masterKey: Buffer, plaintext: string): { iv: string; content: string } {
  const iv: Buffer = QuickCrypto.randomBytes(12);
  const cipher = QuickCrypto.createCipheriv('aes-256-gcm', masterKey, iv);
  const encrypted: Buffer = Buffer.concat([
    cipher.update(Buffer.from(plaintext, 'utf8')),
    cipher.final(),
  ]);
  const tag: Buffer = cipher.getAuthTag();
  const combined = Buffer.concat([encrypted, tag]);
  return { iv: Buffer.from(iv).toString('base64'), content: combined.toString('base64') };
}

function decryptData(masterKey: Buffer, payload: { iv: string; content: string }): string {
  const iv = Buffer.from(payload.iv, 'base64');
  const combined = Buffer.from(payload.content, 'base64');
  const tagStart = combined.length - 16;
  const data = combined.subarray(0, tagStart);
  const tag = combined.subarray(tagStart);
  const decipher = QuickCrypto.createDecipheriv('aes-256-gcm', masterKey, iv);
  decipher.setAuthTag(tag);
  const decrypted: Buffer = Buffer.concat([decipher.update(data), decipher.final()]);
  return decrypted.toString('utf8');
}

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
