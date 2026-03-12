import type { SerializedSenderKeyState } from "../protocol/types";

export type StoredIdentity = {
  signingPublicKey: string; // base64
  signingPrivateKey: string; // base64
  dhPublicKey: string; // base64
  dhPrivateKey: string; // base64
};

export type StoredSignedPreKey = {
  keyId: number;
  privateKey: string; // base64
  publicKey: string; // base64
};

export type StoredOneTimePreKey = {
  keyId: number;
  privateKey: string; // base64
};

export interface CryptoStore {
  // Identity
  getStoredIdentity(userId: string): Promise<StoredIdentity | null>;
  storeIdentity(userId: string, identity: StoredIdentity): Promise<void>;
  deleteStoredIdentity(userId: string): Promise<void>;

  // Sender Keys (replaces sessions)
  getSenderKey(
    conversationId: string,
    senderUserId: string,
    chainId?: string,
  ): Promise<SerializedSenderKeyState | null>;
  saveSenderKey(
    conversationId: string,
    senderUserId: string,
    state: SerializedSenderKeyState,
  ): Promise<void>;
  deleteSenderKey(conversationId: string, senderUserId: string): Promise<void>;
  deleteAllSenderKeys(conversationId: string): Promise<void>;

  // Pre-keys
  getStoredSignedPreKeys(userId: string): Promise<StoredSignedPreKey[]>;
  storeSignedPreKey(userId: string, spk: StoredSignedPreKey): Promise<void>;
  getStoredOneTimePreKeys(userId: string): Promise<StoredOneTimePreKey[]>;
  storeOneTimePreKeys(userId: string, keys: StoredOneTimePreKey[]): Promise<void>;
  consumeOneTimePreKey(userId: string, keyId: number): Promise<string | null>;

  clearAllCryptoData(userId: string): Promise<void>;
}
