import * as SecureStore from 'expo-secure-store';

import { STORAGE_PREFIX } from '@/lib/constants';

function keyId(userId: string): string {
  return `${STORAGE_PREFIX}_private_key_${userId}`;
}

export async function getStoredPrivateKey(userId: string): Promise<JsonWebKey | null> {
  const raw = await SecureStore.getItemAsync(keyId(userId));
  if (!raw) return null;
  return JSON.parse(raw) as JsonWebKey;
}

export async function storePrivateKey(userId: string, privateKeyJwk: JsonWebKey): Promise<void> {
  await SecureStore.setItemAsync(keyId(userId), JSON.stringify(privateKeyJwk));
}

export async function deleteStoredPrivateKey(userId: string): Promise<void> {
  await SecureStore.deleteItemAsync(keyId(userId));
}
