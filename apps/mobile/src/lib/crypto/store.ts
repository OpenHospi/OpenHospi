import type {
  CryptoStore,
  StoredIdentity,
  StoredSignedPreKey,
  StoredOneTimePreKey,
  SerializedSenderKeyState,
} from '@openhospi/crypto';

import { SecureStorage } from './secure-storage';

export class MobileCryptoStore implements CryptoStore {
  // ── Identity ──

  async getStoredIdentity(userId: string): Promise<StoredIdentity | null> {
    const data = await SecureStorage.get(`identity:${userId}`);
    return data ? (JSON.parse(data) as StoredIdentity) : null;
  }

  async storeIdentity(userId: string, identity: StoredIdentity): Promise<void> {
    await SecureStorage.set(`identity:${userId}`, JSON.stringify(identity));
  }

  async deleteStoredIdentity(userId: string): Promise<void> {
    await SecureStorage.delete(`identity:${userId}`);
  }

  // ── Sender Keys ──

  async getSenderKey(
    conversationId: string,
    senderUserId: string
  ): Promise<SerializedSenderKeyState | null> {
    const data = await SecureStorage.get(`senderKey:${conversationId}:${senderUserId}`);
    return data ? (JSON.parse(data) as SerializedSenderKeyState) : null;
  }

  async saveSenderKey(
    conversationId: string,
    senderUserId: string,
    state: SerializedSenderKeyState
  ): Promise<void> {
    await SecureStorage.set(`senderKey:${conversationId}:${senderUserId}`, JSON.stringify(state));
    // Update index for this conversation
    const indexKey = `senderKeyIndex:${conversationId}`;
    const indexData = await SecureStorage.get(indexKey);
    const index: string[] = indexData ? (JSON.parse(indexData) as string[]) : [];
    if (!index.includes(senderUserId)) {
      index.push(senderUserId);
      await SecureStorage.set(indexKey, JSON.stringify(index));
    }
  }

  async deleteSenderKey(conversationId: string, senderUserId: string): Promise<void> {
    await SecureStorage.delete(`senderKey:${conversationId}:${senderUserId}`);
    // Update index
    const indexKey = `senderKeyIndex:${conversationId}`;
    const indexData = await SecureStorage.get(indexKey);
    if (indexData) {
      const index = (JSON.parse(indexData) as string[]).filter((id) => id !== senderUserId);
      if (index.length > 0) {
        await SecureStorage.set(indexKey, JSON.stringify(index));
      } else {
        await SecureStorage.delete(indexKey);
      }
    }
  }

  async deleteAllSenderKeys(conversationId: string): Promise<void> {
    const indexKey = `senderKeyIndex:${conversationId}`;
    const indexData = await SecureStorage.get(indexKey);
    if (indexData) {
      const index = JSON.parse(indexData) as string[];
      for (const senderUserId of index) {
        await SecureStorage.delete(`senderKey:${conversationId}:${senderUserId}`);
      }
      await SecureStorage.delete(indexKey);
    }
  }

  // ── Pre-Keys ──

  async getStoredSignedPreKeys(userId: string): Promise<StoredSignedPreKey[]> {
    const data = await SecureStorage.get(`spk:${userId}`);
    return data ? (JSON.parse(data) as StoredSignedPreKey[]) : [];
  }

  async storeSignedPreKey(userId: string, spk: StoredSignedPreKey): Promise<void> {
    const existing = await this.getStoredSignedPreKeys(userId);
    existing.push(spk);
    await SecureStorage.set(`spk:${userId}`, JSON.stringify(existing));
  }

  async getStoredOneTimePreKeys(userId: string): Promise<StoredOneTimePreKey[]> {
    const data = await SecureStorage.get(`opk:${userId}`);
    return data ? (JSON.parse(data) as StoredOneTimePreKey[]) : [];
  }

  async storeOneTimePreKeys(userId: string, keys: StoredOneTimePreKey[]): Promise<void> {
    const existing = await this.getStoredOneTimePreKeys(userId);
    existing.push(...keys);
    await SecureStorage.set(`opk:${userId}`, JSON.stringify(existing));
  }

  async consumeOneTimePreKey(userId: string, keyId: number): Promise<string | null> {
    const keys = await this.getStoredOneTimePreKeys(userId);
    const idx = keys.findIndex((k) => k.keyId === keyId);
    if (idx === -1) return null;
    const [consumed] = keys.splice(idx, 1);
    await SecureStorage.set(`opk:${userId}`, JSON.stringify(keys));
    return consumed.privateKey;
  }

  async clearAllCryptoData(userId: string): Promise<void> {
    await SecureStorage.delete(`identity:${userId}`);
    await SecureStorage.delete(`spk:${userId}`);
    await SecureStorage.delete(`opk:${userId}`);
    await SecureStorage.deleteByPrefix(`senderKey:`);
    await SecureStorage.deleteByPrefix(`senderKeyIndex:`);
  }
}

export const cryptoStore = new MobileCryptoStore();
