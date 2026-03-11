import type {
  CryptoStore,
  StoredIdentity,
  StoredSignedPreKey,
  StoredOneTimePreKey,
  SerializedRatchetState,
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

  // ── Sessions ──

  private sessionKey(conversationId: string, otherUserId: string): string {
    return `session:${conversationId}:${otherUserId}`;
  }

  async getSession(
    conversationId: string,
    otherUserId: string
  ): Promise<SerializedRatchetState | null> {
    const data = await SecureStorage.get(this.sessionKey(conversationId, otherUserId));
    return data ? (JSON.parse(data) as SerializedRatchetState) : null;
  }

  async saveSession(
    conversationId: string,
    otherUserId: string,
    state: SerializedRatchetState
  ): Promise<void> {
    await SecureStorage.set(this.sessionKey(conversationId, otherUserId), JSON.stringify(state));
  }

  async deleteSession(conversationId: string, otherUserId: string): Promise<void> {
    await SecureStorage.delete(this.sessionKey(conversationId, otherUserId));
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
    await SecureStorage.deleteByPrefix(`session:`);
  }
}

export const cryptoStore = new MobileCryptoStore();
