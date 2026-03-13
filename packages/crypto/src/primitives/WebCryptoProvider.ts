import {
  x25519,
  ed25519,
  edwardsToMontgomeryPub,
  edwardsToMontgomeryPriv,
} from "@noble/curves/ed25519";

import type { CryptoProvider } from "./CryptoProvider";

// Web Crypto API expects BufferSource (ArrayBuffer-backed), but TS 5.7+ is strict
// about Uint8Array<ArrayBufferLike> vs ArrayBufferView<ArrayBuffer>.
// This helper ensures compatibility.
function buf(data: Uint8Array): ArrayBuffer {
  return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
}

/**
 * Web platform crypto provider using @noble/curves + Web Crypto API.
 */
export function createWebCryptoProvider(): CryptoProvider {
  return {
    randomBytes(length: number): Uint8Array {
      const bytes = new Uint8Array(length);
      globalThis.crypto.getRandomValues(bytes);
      return bytes;
    },

    // ── X25519 DH ──

    x25519GenerateKeyPair() {
      const privateKey = x25519.utils.randomPrivateKey();
      const publicKey = x25519.getPublicKey(privateKey);
      return { publicKey, privateKey };
    },

    x25519SharedSecret(privateKey: Uint8Array, publicKey: Uint8Array): Uint8Array {
      return x25519.getSharedSecret(privateKey, publicKey);
    },

    // ── Ed25519 Signatures ──

    ed25519GenerateKeyPair() {
      const privateKey = ed25519.utils.randomPrivateKey();
      const publicKey = ed25519.getPublicKey(privateKey);
      return { publicKey, privateKey };
    },

    ed25519Sign(privateKey: Uint8Array, message: Uint8Array): Uint8Array {
      return ed25519.sign(message, privateKey);
    },

    ed25519Verify(publicKey: Uint8Array, message: Uint8Array, signature: Uint8Array): boolean {
      try {
        return ed25519.verify(signature, message, publicKey);
      } catch {
        return false;
      }
    },

    // ── Ed25519 ↔ X25519 Conversion ──

    edToX25519Public(edPublicKey: Uint8Array): Uint8Array {
      return edwardsToMontgomeryPub(edPublicKey);
    },

    edToX25519Private(edPrivateKey: Uint8Array): Uint8Array {
      return edwardsToMontgomeryPriv(edPrivateKey);
    },

    // ── Symmetric Crypto (Web Crypto API — natively async) ──

    async hmacSha256(key: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
      const cryptoKey = await globalThis.crypto.subtle.importKey(
        "raw",
        buf(key),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"],
      );
      const signature = await globalThis.crypto.subtle.sign("HMAC", cryptoKey, buf(data));
      return new Uint8Array(signature);
    },

    async hkdf(
      ikm: Uint8Array,
      salt: Uint8Array,
      info: Uint8Array,
      length: number,
    ): Promise<Uint8Array> {
      const baseKey = await globalThis.crypto.subtle.importKey("raw", buf(ikm), "HKDF", false, [
        "deriveBits",
      ]);
      const derived = await globalThis.crypto.subtle.deriveBits(
        { name: "HKDF", hash: "SHA-256", salt: buf(salt), info: buf(info) },
        baseKey,
        length * 8,
      );
      return new Uint8Array(derived);
    },

    async aesCbcEncrypt(
      key: Uint8Array,
      plaintext: Uint8Array,
      iv: Uint8Array,
    ): Promise<Uint8Array> {
      const cryptoKey = await globalThis.crypto.subtle.importKey(
        "raw",
        buf(key),
        { name: "AES-CBC" },
        false,
        ["encrypt"],
      );
      const result = await globalThis.crypto.subtle.encrypt(
        { name: "AES-CBC", iv: buf(iv) },
        cryptoKey,
        buf(plaintext),
      );
      return new Uint8Array(result);
    },

    async aesCbcDecrypt(
      key: Uint8Array,
      ciphertext: Uint8Array,
      iv: Uint8Array,
    ): Promise<Uint8Array> {
      const cryptoKey = await globalThis.crypto.subtle.importKey(
        "raw",
        buf(key),
        { name: "AES-CBC" },
        false,
        ["decrypt"],
      );
      const result = await globalThis.crypto.subtle.decrypt(
        { name: "AES-CBC", iv: buf(iv) },
        cryptoKey,
        buf(ciphertext),
      );
      return new Uint8Array(result);
    },

    async aesGcmEncrypt(
      key: Uint8Array,
      plaintext: Uint8Array,
      iv: Uint8Array,
      aad?: Uint8Array,
    ): Promise<Uint8Array> {
      const cryptoKey = await globalThis.crypto.subtle.importKey(
        "raw",
        buf(key),
        { name: "AES-GCM" },
        false,
        ["encrypt"],
      );
      const params: AesGcmParams = { name: "AES-GCM", iv: buf(iv) };
      if (aad) params.additionalData = buf(aad);
      const result = await globalThis.crypto.subtle.encrypt(params, cryptoKey, buf(plaintext));
      return new Uint8Array(result);
    },

    async aesGcmDecrypt(
      key: Uint8Array,
      ciphertext: Uint8Array,
      iv: Uint8Array,
      aad?: Uint8Array,
    ): Promise<Uint8Array> {
      const cryptoKey = await globalThis.crypto.subtle.importKey(
        "raw",
        buf(key),
        { name: "AES-GCM" },
        false,
        ["decrypt"],
      );
      const params: AesGcmParams = { name: "AES-GCM", iv: buf(iv) };
      if (aad) params.additionalData = buf(aad);
      const result = await globalThis.crypto.subtle.decrypt(params, cryptoKey, buf(ciphertext));
      return new Uint8Array(result);
    },

    async pbkdf2(
      password: Uint8Array,
      salt: Uint8Array,
      iterations: number,
      keyLength: number,
    ): Promise<Uint8Array> {
      const baseKey = await globalThis.crypto.subtle.importKey(
        "raw",
        buf(password),
        "PBKDF2",
        false,
        ["deriveBits"],
      );
      const derived = await globalThis.crypto.subtle.deriveBits(
        { name: "PBKDF2", hash: "SHA-256", salt: buf(salt), iterations },
        baseKey,
        keyLength * 8,
      );
      return new Uint8Array(derived);
    },
  };
}
