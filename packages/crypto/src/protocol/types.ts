/** A raw key pair (public + private) as Uint8Arrays. */
export interface KeyPair {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
}

/** Addresses a specific device of a specific user. */
export interface ProtocolAddress {
  userId: string;
  deviceId: string;
}

/** Pre-key bundle fetched from the server for X3DH session establishment. */
export interface PreKeyBundle {
  registrationId: number;
  deviceId: string;
  identityKey: Uint8Array;
  signedPreKeyId: number;
  signedPreKey: Uint8Array;
  signedPreKeySignature: Uint8Array;
  oneTimePreKeyId?: number;
  oneTimePreKey?: Uint8Array;
}

/** Persistent state of a Double Ratchet session. */
export interface SessionState {
  rootKey: Uint8Array;
  sendingChainKey: Uint8Array | null;
  receivingChainKey: Uint8Array | null;
  sendingRatchetKey: KeyPair | null;
  receivingRatchetKey: Uint8Array | null;
  sendingCounter: number;
  receivingCounter: number;
  previousSendingCounter: number;
  skippedKeys: Map<string, Uint8Array>;
  remoteIdentityKey: Uint8Array;
  localIdentityKey: Uint8Array;
}

/** Record wrapping a session state for serialisation. */
export interface SessionRecord {
  state: SessionState;
  version: number;
}

/** A pre-key record (public + private). */
export interface PreKeyRecord {
  keyId: number;
  keyPair: KeyPair;
}

/** A signed pre-key record. */
export interface SignedPreKeyRecord {
  keyId: number;
  keyPair: KeyPair;
  signature: Uint8Array;
  timestamp: number;
}

/** State for a Sender Key (group encryption). */
export interface SenderKeyState {
  chainKey: Uint8Array;
  iteration: number;
  signingKeyPair: KeyPair;
}

/** Record wrapping sender key state for serialisation. */
export interface SenderKeyRecord {
  state: SenderKeyState;
}

/** The initial distribution message for a Sender Key. */
export interface SenderKeyDistributionMessage {
  distributionId: string;
  chainKey: Uint8Array;
  iteration: number;
  signingKey: Uint8Array;
}

/** Wire format for a pre-key whisper message (first message in a session). */
export interface PreKeyWhisperMessage {
  registrationId: number;
  preKeyId?: number;
  signedPreKeyId: number;
  baseKey: Uint8Array;
  identityKey: Uint8Array;
  message: Uint8Array; // serialised WhisperMessage
}

/** Wire format for a regular whisper message (after session establishment). */
export interface WhisperMessage {
  ratchetKey: Uint8Array;
  counter: number;
  previousCounter: number;
  ciphertext: Uint8Array;
}

/** Wire format for a sender key message (group message). */
export interface SenderKeyMessageData {
  distributionId: string;
  chainId: number; // iteration of the chain key used
  ciphertext: Uint8Array;
  signature: Uint8Array;
}

/** Encrypted key backup data. */
export interface EncryptedBackup {
  version: number;
  ciphertext: string;
  iv: string;
  salt: string;
}
