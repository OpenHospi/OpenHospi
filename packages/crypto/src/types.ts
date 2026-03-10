/**
 * Signal Protocol types for X3DH + Double Ratchet E2EE.
 *
 * All keys are raw Uint8Array bytes — no CryptoKey wrappers.
 * Ed25519 for signing, X25519 for Diffie-Hellman.
 */

/** Raw byte key pair (X25519 or Ed25519) */
export type KeyPair = {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
};

/** Ed25519 signing pair + derived X25519 DH pair */
export type IdentityKeyPair = {
  /** Ed25519 signing key pair */
  signing: KeyPair;
  /** X25519 DH key pair (derived from Ed25519) */
  dh: KeyPair;
};

/** Signed pre-key: X25519 pair + Ed25519 signature over the public key */
export type SignedPreKey = {
  keyId: number;
  keyPair: KeyPair;
  signature: Uint8Array;
};

/** One-time pre-key: X25519 pair */
export type OneTimePreKey = {
  keyId: number;
  keyPair: KeyPair;
};

/** Pre-key bundle fetched from server for X3DH session setup */
export type PreKeyBundle = {
  /** Remote user's X25519 identity public key */
  identityKey: Uint8Array;
  /** Remote user's Ed25519 signing public key */
  signingKey: Uint8Array;
  /** Signed pre-key public key */
  signedPreKeyPublic: Uint8Array;
  /** Signed pre-key ID */
  signedPreKeyId: number;
  /** Ed25519 signature over signed pre-key public */
  signedPreKeySignature: Uint8Array;
  /** One-time pre-key public key (optional — may be exhausted) */
  oneTimePreKeyPublic?: Uint8Array;
  /** One-time pre-key ID */
  oneTimePreKeyId?: number;
};

/** Result of X3DH key exchange (initiator side) */
export type X3DHResult = {
  /** 32-byte shared secret */
  sharedSecret: Uint8Array;
  /** Ephemeral public key to send to responder */
  ephemeralPublicKey: Uint8Array;
  /** ID of the signed pre-key used */
  usedSignedPreKeyId: number;
  /** ID of the one-time pre-key used (if available) */
  usedOneTimePreKeyId?: number;
};

/** Double Ratchet session state (serializable for persistence) */
export type RatchetState = {
  /** 32-byte root key */
  rootKey: Uint8Array;
  /** Sending chain key (null before first send after DH step) */
  sendingChainKey: Uint8Array | null;
  /** Receiving chain key (null before first receive) */
  receivingChainKey: Uint8Array | null;
  /** Our current DH ratchet key pair (X25519) */
  dhSendingKeyPair: KeyPair;
  /** Their current DH ratchet public key */
  dhReceivingPublicKey: Uint8Array | null;
  /** Number of messages sent in current sending chain */
  sendingChainLength: number;
  /** Number of messages received in current receiving chain */
  receivingChainLength: number;
  /** Previous sending chain length (for header) */
  previousSendingChainLength: number;
  /** Skipped message keys: serialized as array of [key, value] pairs */
  skippedMessageKeys: SkippedKeyEntry[];
};

/** Entry for a skipped message key */
export type SkippedKeyEntry = {
  /** Base64 of the ratchet public key */
  ratchetPublicKey: string;
  /** Message number in that chain */
  messageNumber: number;
  /** 32-byte message key */
  messageKey: Uint8Array;
};

/** Header sent with each Double Ratchet message */
export type MessageHeader = {
  /** Sender's current DH ratchet public key (base64) */
  ratchetPublicKey: string;
  /** Message number in current sending chain */
  messageNumber: number;
  /** Length of previous sending chain */
  previousChainLength: number;
};

/** Encrypted message output from Double Ratchet */
export type EncryptedMessage = {
  header: MessageHeader;
  /** Base64-encoded ciphertext */
  ciphertext: string;
  /** Base64-encoded IV */
  iv: string;
};

/** Full serializable session state for IndexedDB/SQLite persistence */
export type SessionState = {
  /** Our identity key pair (Ed25519 signing + X25519 DH) */
  localIdentity: {
    signingPublicKey: string; // base64
    dhPublicKey: string; // base64
  };
  /** Remote user's identity public keys */
  remoteIdentity: {
    signingPublicKey: string; // base64
    dhPublicKey: string; // base64
  };
  /** Serialized ratchet state */
  ratchet: SerializedRatchetState;
};

/** JSON-safe version of RatchetState (all Uint8Arrays as base64) */
export type SerializedRatchetState = {
  rootKey: string;
  sendingChainKey: string | null;
  receivingChainKey: string | null;
  dhSendingKeyPair: { publicKey: string; privateKey: string };
  dhReceivingPublicKey: string | null;
  sendingChainLength: number;
  receivingChainLength: number;
  previousSendingChainLength: number;
  skippedMessageKeys: SerializedSkippedKeyEntry[];
};

/** JSON-safe skipped key entry */
export type SerializedSkippedKeyEntry = {
  ratchetPublicKey: string;
  messageNumber: number;
  messageKey: string;
};
