/** Platform-agnostic interface for cryptographic operations. */
export interface CryptoProvider {
  /** Generate `length` random bytes. */
  randomBytes(length: number): Uint8Array;

  /** HMAC-SHA256(key, data). */
  hmacSha256(key: Uint8Array, data: Uint8Array): Uint8Array;

  /** HKDF-SHA256 key derivation. */
  hkdf(ikm: Uint8Array, salt: Uint8Array, info: Uint8Array, length: number): Uint8Array;

  /** AES-256-CBC encrypt. Returns ciphertext (no IV prepended). */
  aesCbcEncrypt(key: Uint8Array, iv: Uint8Array, plaintext: Uint8Array): Uint8Array;

  /** AES-256-CBC decrypt. */
  aesCbcDecrypt(key: Uint8Array, iv: Uint8Array, ciphertext: Uint8Array): Uint8Array;
}

let _provider: CryptoProvider | null = null;

/** Set the active CryptoProvider (call once at app startup). */
export function setCryptoProvider(provider: CryptoProvider): void {
  _provider = provider;
}

/** Get the active CryptoProvider. Throws if not set. */
export function getCryptoProvider(): CryptoProvider {
  if (!_provider) {
    throw new Error("CryptoProvider not initialized. Call setCryptoProvider() at app startup.");
  }
  return _provider;
}
