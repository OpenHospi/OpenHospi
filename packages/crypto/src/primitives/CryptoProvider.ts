/**
 * Platform-agnostic cryptographic operations interface.
 *
 * Web: @noble/curves + Web Crypto API
 * Native: @noble/curves + react-native-quick-crypto
 */
export interface CryptoProvider {
  randomBytes(length: number): Uint8Array;

  // ── X25519 Diffie-Hellman (@noble/curves on BOTH platforms) ──

  x25519GenerateKeyPair(): { publicKey: Uint8Array; privateKey: Uint8Array };
  x25519SharedSecret(privateKey: Uint8Array, publicKey: Uint8Array): Uint8Array;

  // ── Ed25519 Signatures ──

  ed25519GenerateKeyPair(): { publicKey: Uint8Array; privateKey: Uint8Array };
  ed25519Sign(privateKey: Uint8Array, message: Uint8Array): Uint8Array;
  ed25519Verify(publicKey: Uint8Array, message: Uint8Array, signature: Uint8Array): boolean;

  // ── Ed25519 ↔ X25519 Conversion ──

  edToX25519Public(edPublicKey: Uint8Array): Uint8Array;
  edToX25519Private(edPrivateKey: Uint8Array): Uint8Array;

  // ── Symmetric Crypto (async — Web Crypto is async, native wraps sync) ──

  hmacSha256(key: Uint8Array, data: Uint8Array): Promise<Uint8Array>;

  hkdf(ikm: Uint8Array, salt: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array>;

  aesCbcEncrypt(key: Uint8Array, plaintext: Uint8Array, iv: Uint8Array): Promise<Uint8Array>;
  aesCbcDecrypt(key: Uint8Array, ciphertext: Uint8Array, iv: Uint8Array): Promise<Uint8Array>;

  aesGcmEncrypt(
    key: Uint8Array,
    plaintext: Uint8Array,
    iv: Uint8Array,
    aad?: Uint8Array,
  ): Promise<Uint8Array>;
  aesGcmDecrypt(
    key: Uint8Array,
    ciphertext: Uint8Array,
    iv: Uint8Array,
    aad?: Uint8Array,
  ): Promise<Uint8Array>;

  pbkdf2(
    password: Uint8Array,
    salt: Uint8Array,
    iterations: number,
    keyLength: number,
  ): Promise<Uint8Array>;
}

let _provider: CryptoProvider | null = null;

export function setCryptoProvider(provider: CryptoProvider): void {
  _provider = provider;
}

export function getCryptoProvider(): CryptoProvider {
  if (!_provider) {
    throw new Error(
      "CryptoProvider not set. Call setCryptoProvider() with a platform-specific provider first.",
    );
  }
  return _provider;
}
