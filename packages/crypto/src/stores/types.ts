import type {
  KeyPair,
  PreKeyRecord,
  ProtocolAddress,
  SenderKeyRecord,
  SessionRecord,
  SignedPreKeyRecord,
} from "../protocol/types";

/** Store for identity key pairs and trusted remote identity keys. */
export interface IdentityKeyStore {
  getIdentityKeyPair(): Promise<KeyPair>;
  getSigningKeyPair(): Promise<KeyPair>;
  getLocalRegistrationId(): Promise<number>;
  setIdentityKeyPair(dhKeyPair: KeyPair, signingKeyPair: KeyPair): Promise<void>;
  setLocalRegistrationId(id: number): Promise<void>;
  saveIdentity(address: ProtocolAddress, identityKey: Uint8Array): Promise<boolean>;
  isTrustedIdentity(address: ProtocolAddress, identityKey: Uint8Array): Promise<boolean>;
  getIdentity(address: ProtocolAddress): Promise<Uint8Array | null>;
}

/** Store for one-time pre-keys. */
export interface PreKeyStore {
  loadPreKey(preKeyId: number): Promise<PreKeyRecord>;
  storePreKey(preKeyId: number, record: PreKeyRecord): Promise<void>;
  removePreKey(preKeyId: number): Promise<void>;
  getAvailablePreKeyCount(): Promise<number>;
  getMaxPreKeyId(): Promise<number>;
}

/** Store for signed pre-keys. */
export interface SignedPreKeyStore {
  loadSignedPreKey(signedPreKeyId: number): Promise<SignedPreKeyRecord>;
  storeSignedPreKey(signedPreKeyId: number, record: SignedPreKeyRecord): Promise<void>;
}

/** Store for Double Ratchet sessions. */
export interface SessionStore {
  loadSession(address: ProtocolAddress): Promise<SessionRecord | null>;
  storeSession(address: ProtocolAddress, record: SessionRecord): Promise<void>;
  getSubDeviceSessions(userId: string): Promise<number[]>;
}

/** Store for Sender Key state (group encryption). */
export interface SenderKeyStore {
  storeSenderKey(
    sender: ProtocolAddress,
    distributionId: string,
    record: SenderKeyRecord,
  ): Promise<void>;
  loadSenderKey(sender: ProtocolAddress, distributionId: string): Promise<SenderKeyRecord | null>;
}

/** Combined store interface for convenience. */
export interface SignalProtocolStore
  extends IdentityKeyStore, PreKeyStore, SignedPreKeyStore, SessionStore, SenderKeyStore {}
