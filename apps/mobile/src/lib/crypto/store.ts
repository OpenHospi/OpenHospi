import type {
  CryptoStore,
  StoredIdentity,
  StoredSignedPreKey,
  StoredOneTimePreKey,
  SerializedSenderKeyState,
} from '@openhospi/crypto';

import { SecureStorage } from './secure-storage';

const MAX_SENDER_KEY_STATES = 5;

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

  // ── Sender Keys (multi-state: up to 5 states per sender) ──

  private migrateToMultiState(raw: string): SerializedSenderKeyState[] {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) return parsed as SerializedSenderKeyState[];
    if (parsed && typeof parsed === 'object' && 'chainKey' in parsed) {
      const single = parsed as SerializedSenderKeyState;
      if (!single.chainId) {
        single.chainId = `migrated-${Date.now()}`;
      }
      return [single];
    }
    return [];
  }

  async getSenderKey(
    conversationId: string,
    senderUserId: string,
    chainId?: string
  ): Promise<SerializedSenderKeyState | null> {
    const data = await SecureStorage.get(`senderKey:${conversationId}:${senderUserId}`);
    if (!data) return null;

    const states = this.migrateToMultiState(data);
    if (states.length === 0) return null;

    if (chainId) {
      return states.find((s) => s.chainId === chainId) ?? null;
    }
    return states[0];
  }

  async saveSenderKey(
    conversationId: string,
    senderUserId: string,
    state: SerializedSenderKeyState
  ): Promise<void> {
    const key = `senderKey:${conversationId}:${senderUserId}`;
    const data = await SecureStorage.get(key);
    const existing = data ? this.migrateToMultiState(data) : [];

    const idx = existing.findIndex((s) => s.chainId === state.chainId);
    if (idx >= 0) {
      existing[idx] = state;
    } else {
      existing.unshift(state);
    }

    const trimmed = existing.slice(0, MAX_SENDER_KEY_STATES);
    await SecureStorage.set(key, JSON.stringify(trimmed));

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
