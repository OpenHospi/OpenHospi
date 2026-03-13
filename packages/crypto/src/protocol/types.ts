// ── Fundamental Key Types ──

export interface KeyPair {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
}

export interface IdentityKeyPair {
  /** Ed25519 signing key pair (root identity) */
  signingKeyPair: KeyPair;
  /** X25519 DH key pair (derived from Ed25519 for key agreement) */
  dhKeyPair: KeyPair;
}

export interface SignedPreKey {
  keyId: number;
  keyPair: KeyPair;
  signature: Uint8Array; // Ed25519 signature over the X25519 public key
}

export interface OneTimePreKey {
  keyId: number;
  keyPair: KeyPair;
}

// ── PreKey Bundle (fetched from server for session establishment) ──

export interface PreKeyBundle {
  registrationId: number;
  deviceId: number;
  identityKey: Uint8Array; // X25519 public key
  signedPreKeyId: number;
  signedPreKeyPublic: Uint8Array; // X25519 public key
  signedPreKeySignature: Uint8Array; // Ed25519 signature
  oneTimePreKeyId?: number;
  oneTimePreKeyPublic?: Uint8Array; // X25519 public key
}

// ── X3DH Key Agreement ──

export interface X3DHResult {
  sharedSecret: Uint8Array; // 32-byte root key material
  ephemeralKeyPair: KeyPair; // Alice's ephemeral X25519 key pair
  usedOneTimePreKeyId?: number;
}

// ── Double Ratchet Session State ──

export interface ChainState {
  chainKey: Uint8Array; // 32 bytes
  messageCounter: number;
}

export interface SessionState {
  rootKey: Uint8Array; // 32 bytes
  sendingChain: ChainState;
  receivingChain: ChainState | null;
  localRatchetKeyPair: KeyPair; // X25519 ratchet key pair
  remoteRatchetPublicKey: Uint8Array; // X25519 remote ratchet public key
  previousSendingChainLength: number;
  localRegistrationId: number;
  remoteRegistrationId: number;
}

// ── Wire Messages ──

export interface WhisperMessage {
  ratchetPublicKey: Uint8Array; // X25519 public key of sender's current ratchet
  counter: number;
  previousCounter: number;
  ciphertext: Uint8Array; // AES-256-CBC encrypted plaintext
  mac: Uint8Array; // HMAC-SHA256 over the message
}

export interface PreKeyWhisperMessage {
  identityKey: Uint8Array; // Sender's X25519 identity public key
  ephemeralKey: Uint8Array; // Sender's ephemeral X25519 public key
  signedPreKeyId: number;
  oneTimePreKeyId?: number;
  registrationId: number;
  message: WhisperMessage;
}

export type MessageEnvelope =
  | { type: "prekey"; data: PreKeyWhisperMessage }
  | { type: "whisper"; data: WhisperMessage };

// ── Sender Key Types ──

export interface SenderKeyState {
  senderKeyId: number;
  chainKey: Uint8Array; // 32 bytes
  signatureKeyPair: KeyPair; // Ed25519 key pair for signing
  iteration: number;
}

export interface SenderKeyDistributionMessage {
  senderKeyId: number;
  iteration: number;
  chainKey: Uint8Array; // 32 bytes
  signingPublicKey: Uint8Array; // Ed25519 public key
}

export interface GroupCiphertextPayload {
  senderKeyId: number;
  iteration: number;
  ciphertext: Uint8Array;
  signature: Uint8Array; // Ed25519 signature over ciphertext
}

// ── Protocol Address ──

export interface ProtocolAddress {
  name: string; // user UUID
  deviceId: number; // per-user device number
}

// ── Skipped Message Key ──

export interface SkippedKey {
  ratchetPublicKey: Uint8Array;
  messageIndex: number;
  messageKey: Uint8Array;
}

// ── Serialized Forms (for storage) ──

export interface SerializedSessionState {
  rootKey: string;
  sendingChain: { chainKey: string; messageCounter: number };
  receivingChain: { chainKey: string; messageCounter: number } | null;
  localRatchetKeyPair: { publicKey: string; privateKey: string };
  remoteRatchetPublicKey: string;
  previousSendingChainLength: number;
  localRegistrationId: number;
  remoteRegistrationId: number;
}

export interface SerializedSenderKeyState {
  senderKeyId: number;
  chainKey: string;
  signatureKeyPair: { publicKey: string; privateKey: string };
  iteration: number;
}
