import type { KeyPair } from "./types";

/**
 * Platform-agnostic crypto backend interface.
 *
 * X25519/Ed25519 operations are synchronous (fast curve math).
 * AES-GCM/HKDF/PBKDF2 are async (Web Crypto is async; native wraps sync in Promise).
 *
 * Implementations:
 * - Web: @noble/curves for Ed25519/X25519, native Web Crypto for AES/HKDF/PBKDF2
 * - Native (React Native): react-native-quick-crypto for all operations
 */
export interface CryptoBackend {
  // ── Synchronous curve operations ──

  /** Generate an X25519 key pair for Diffie-Hellman */
  generateX25519KeyPair(): KeyPair;

  /** Perform X25519 Diffie-Hellman: returns 32-byte shared secret */
  x25519(privateKey: Uint8Array, publicKey: Uint8Array): Uint8Array;

  /** Generate an Ed25519 key pair for signing */
  generateEd25519KeyPair(): KeyPair;

  /** Sign a message with Ed25519 (returns 64-byte signature) */
  ed25519Sign(privateKey: Uint8Array, message: Uint8Array): Uint8Array;

  /** Verify an Ed25519 signature */
  ed25519Verify(publicKey: Uint8Array, message: Uint8Array, signature: Uint8Array): boolean;

  /** Convert Ed25519 public key to X25519 public key */
  edToX25519Public(edPublicKey: Uint8Array): Uint8Array;

  /** Convert Ed25519 private key to X25519 private key */
  edToX25519Private(edPrivateKey: Uint8Array): Uint8Array;

  /** Generate cryptographically secure random bytes */
  randomBytes(length: number): Uint8Array;

  // ── Async operations (Web Crypto is async) ──

  /** HKDF-SHA256 key derivation */
  hkdf(ikm: Uint8Array, salt: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array>;

  /** AES-256-GCM encrypt (returns ciphertext + 16-byte auth tag appended) */
  aesGcmEncrypt(
    key: Uint8Array,
    plaintext: Uint8Array,
    iv: Uint8Array,
    aad?: Uint8Array,
  ): Promise<Uint8Array>;

  /** AES-256-GCM decrypt (ciphertext includes 16-byte auth tag at end) */
  aesGcmDecrypt(
    key: Uint8Array,
    ciphertext: Uint8Array,
    iv: Uint8Array,
    aad?: Uint8Array,
  ): Promise<Uint8Array>;

  /** PBKDF2-SHA256 key derivation */
  pbkdf2(
    password: Uint8Array,
    salt: Uint8Array,
    iterations: number,
    keyLength: number,
  ): Promise<Uint8Array>;
}

/** Global backend instance — set via setBackend() at app startup */
let _backend: CryptoBackend | null = null;

/** Set the active crypto backend (call once at app startup) */
export function setBackend(backend: CryptoBackend): void {
  _backend = backend;
}

/** Get the active crypto backend (throws if not initialized) */
export function getBackend(): CryptoBackend {
  if (!_backend) {
    throw new Error(
      "Crypto backend not initialized. Call setBackend() with WebCryptoBackend or NativeCryptoBackend at app startup.",
    );
  }
  return _backend;
}
