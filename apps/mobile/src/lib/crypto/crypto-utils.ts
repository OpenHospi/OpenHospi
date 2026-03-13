/**
 * Master key management and encryption primitives for mobile crypto stores.
 * Master key is stored in expo-secure-store (Keychain/Keystore),
 * used to encrypt all private key material in SQLite.
 */
import * as SecureStore from 'expo-secure-store';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const QuickCrypto = require('react-native-quick-crypto');

const MASTER_KEY_ID = 'openhospi_master_key';

let cachedMasterKey: Buffer | null = null;

export async function getMasterKey(): Promise<Buffer> {
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

export function encryptData(masterKey: Buffer, plaintext: string): { iv: string; content: string } {
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

export function decryptData(masterKey: Buffer, payload: { iv: string; content: string }): string {
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

/** Encrypt a string value with the master key. */
export async function encryptValue(value: string): Promise<string> {
  const masterKey = await getMasterKey();
  return JSON.stringify(encryptData(masterKey, value));
}

/** Decrypt a previously encrypted string value. */
export async function decryptValue(encrypted: string): Promise<string> {
  const masterKey = await getMasterKey();
  const payload = JSON.parse(encrypted) as { iv: string; content: string };
  return decryptData(masterKey, payload);
}
