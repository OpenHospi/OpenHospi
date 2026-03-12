/**
 * Signal Sender Keys protocol types for E2EE.
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

/** Server-side pre-key bundle (base64 strings instead of Uint8Array) */
export type ServerPreKeyBundle = {
  identityPublicKey: string;
  signingPublicKey: string;
  signedPreKeyPublic: string;
  signedPreKeyId: number;
  signedPreKeySignature: string;
  oneTimePreKeyPublic?: string;
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

// ── Sender Key Types ──

/** Sender Key state for a single user in a conversation */
export type SenderKeyState = {
  /** Unique identifier for this key generation (like Signal's distributionId) */
  chainId: string;
  /** Current HMAC chain key (32 bytes) */
  chainKey: Uint8Array;
  /** Ed25519 signing key pair for authenticating ciphertexts */
  signingKeyPair: KeyPair;
  /** Current chain iteration (incremented per message) */
  iteration: number;
  /** Cached message keys for out-of-order delivery: iteration → messageKey */
  skippedMessageKeys: Map<number, Uint8Array>;
};

/** JSON-safe version of SenderKeyState */
export type SerializedSenderKeyState = {
  chainId: string;
  chainKey: string; // base64
  signingPublicKey: string; // base64
  signingPrivateKey?: string; // base64, only present for OWN sender key
  iteration: number;
  skippedMessageKeys: Array<{ iteration: number; messageKey: string }>;
};

/** Data distributed to group members to enable decryption */
export type SenderKeyDistributionData = {
  chainId: string; // unique identifier for this key generation
  chainKey: string; // base64, initial chain key
  signingPublicKey: string; // base64, Ed25519 verification key
  iteration: number; // starting iteration (0 for fresh)
};

/** Encrypted group message payload (one per message, shared by all recipients) */
export type GroupCiphertextPayload = {
  ciphertext: string; // base64, AES-256-GCM
  iv: string; // base64, 12 bytes
  signature: string; // base64, Ed25519 over (ciphertext || iv || iteration || chainId)
  chainIteration: number; // position in sender's chain
  chainId: string; // identifies which key generation was used
};

/** X3DH-encrypted envelope containing a Sender Key distribution */
export type SenderKeyDistributionEnvelope = {
  encryptedKeyData: string; // base64, AES-GCM encrypted SenderKeyDistributionData
  iv: string; // base64
  ephemeralPublicKey: string; // base64, X3DH
  senderIdentityKey: string; // base64, X3DH sender's DH identity pub
  usedSignedPreKeyId: number;
  usedOneTimePreKeyId?: number;
};
