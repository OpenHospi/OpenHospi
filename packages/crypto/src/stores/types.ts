import type {
  IdentityKeyPair,
  OneTimePreKey,
  ProtocolAddress,
  SenderKeyState,
  SessionState,
  SignedPreKey,
  SkippedKey,
} from "../protocol/types";

// ── Identity Key Store ──

export interface IdentityKeyStore {
  getIdentityKeyPair(): Promise<IdentityKeyPair>;
  getLocalRegistrationId(): Promise<number>;

  /** Persist the local identity key pair and registration ID. */
  storeIdentityKeyPair(identity: IdentityKeyPair, registrationId: number): Promise<void>;

  /** Save a remote identity key. Returns true if the key was updated (changed). */
  saveIdentity(address: ProtocolAddress, identityKey: Uint8Array): Promise<boolean>;

  /** Check if a remote identity key is trusted (matches stored key or is new). */
  isTrustedIdentity(address: ProtocolAddress, identityKey: Uint8Array): Promise<boolean>;
}

// ── Pre Key Store ──

export interface PreKeyStore {
  loadPreKey(preKeyId: number): Promise<OneTimePreKey>;
  storePreKey(preKeyId: number, record: OneTimePreKey): Promise<void>;
  removePreKey(preKeyId: number): Promise<void>;
  getAvailablePreKeyCount(): Promise<number>;
}

// ── Signed Pre Key Store ──

export interface SignedPreKeyStore {
  loadSignedPreKey(signedPreKeyId: number): Promise<SignedPreKey>;
  storeSignedPreKey(signedPreKeyId: number, record: SignedPreKey): Promise<void>;
}

// ── Session Store ──

export interface SessionStore {
  loadSession(address: ProtocolAddress): Promise<SessionState | null>;
  storeSession(address: ProtocolAddress, record: SessionState): Promise<void>;
  deleteSession(address: ProtocolAddress): Promise<void>;

  /** Get all device IDs that have active sessions for a given user. */
  getSubDeviceSessions(userId: string): Promise<number[]>;
}

// ── Sender Key Store ──

export interface SenderKeyStore {
  storeSenderKey(
    sender: ProtocolAddress,
    distributionId: string,
    record: SenderKeyState,
  ): Promise<void>;

  loadSenderKey(sender: ProtocolAddress, distributionId: string): Promise<SenderKeyState | null>;

  deleteSenderKey(sender: ProtocolAddress, distributionId: string): Promise<void>;
}

// ── Skipped Key Store ──

export interface SkippedKeyStore {
  loadSkippedKeys(address: ProtocolAddress): Promise<SkippedKey[]>;
  storeSkippedKeys(address: ProtocolAddress, keys: SkippedKey[]): Promise<void>;
  deleteSkippedKeys(address: ProtocolAddress): Promise<void>;
}

// ── Composite Store (convenience for implementations that bundle all stores) ──

export interface SignalProtocolStore
  extends
    IdentityKeyStore,
    PreKeyStore,
    SignedPreKeyStore,
    SessionStore,
    SenderKeyStore,
    SkippedKeyStore {
  /** Remove all local crypto data (identity, prekeys, sessions, sender keys). */
  clearAllData(): Promise<void>;
}
