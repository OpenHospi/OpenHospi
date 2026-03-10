import * as SecureStore from 'expo-secure-store';

import { STORAGE_PREFIX } from '@/lib/constants';

export type StoredIdentity = {
  signingPublicKey: string;
  signingPrivateKey: string;
  dhPublicKey: string;
  dhPrivateKey: string;
};

function identityKey(userId: string): string {
  return `${STORAGE_PREFIX}_identity_${userId}`;
}

export async function getStoredIdentity(userId: string): Promise<StoredIdentity | null> {
  const raw = await SecureStore.getItemAsync(identityKey(userId));
  if (!raw) return null;
  return JSON.parse(raw) as StoredIdentity;
}

export async function storeIdentity(userId: string, identity: StoredIdentity): Promise<void> {
  await SecureStore.setItemAsync(identityKey(userId), JSON.stringify(identity));
}

export async function deleteStoredIdentity(userId: string): Promise<void> {
  await SecureStore.deleteItemAsync(identityKey(userId));
}
