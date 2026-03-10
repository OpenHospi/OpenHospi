/**
 * Web crypto backend: @noble/curves v2 for Ed25519/X25519, native Web Crypto for AES/HKDF/PBKDF2.
 *
 * @noble/curves is audited, zero-dependency, and provides the Ed25519↔X25519 conversion
 * needed for the Signal Protocol identity key design.
 */
import { ed25519, x25519 } from "@noble/curves/ed25519.js";

import type { CryptoBackend } from "./platform";
import type { KeyPair } from "./types";

// Web Crypto expects Uint8Array<ArrayBuffer>, but generic Uint8Array has ArrayBufferLike.
// This helper narrows the type to satisfy strict TS checks.
function buf(data: Uint8Array): Uint8Array<ArrayBuffer> {
  return new Uint8Array(data);
}

export class WebCryptoBackend implements CryptoBackend {
  generateX25519KeyPair(): KeyPair {
    const privateKey = x25519.utils.randomSecretKey();
    const publicKey = x25519.getPublicKey(privateKey);
    return { publicKey, privateKey };
  }

  x25519(privateKey: Uint8Array, publicKey: Uint8Array): Uint8Array {
    return x25519.getSharedSecret(privateKey, publicKey);
  }

  generateEd25519KeyPair(): KeyPair {
    const privateKey = ed25519.utils.randomSecretKey();
    const publicKey = ed25519.getPublicKey(privateKey);
    return { publicKey, privateKey };
  }

  ed25519Sign(privateKey: Uint8Array, message: Uint8Array): Uint8Array {
    return ed25519.sign(message, privateKey);
  }

  ed25519Verify(publicKey: Uint8Array, message: Uint8Array, signature: Uint8Array): boolean {
    try {
      return ed25519.verify(signature, message, publicKey);
    } catch {
      return false;
    }
  }

  edToX25519Public(edPublicKey: Uint8Array): Uint8Array {
    return ed25519.utils.toMontgomery(edPublicKey);
  }

  edToX25519Private(edPrivateKey: Uint8Array): Uint8Array {
    return ed25519.utils.toMontgomerySecret(edPrivateKey);
  }

  randomBytes(length: number): Uint8Array {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return bytes;
  }

  async hkdf(
    ikm: Uint8Array,
    salt: Uint8Array,
    info: Uint8Array,
    length: number,
  ): Promise<Uint8Array> {
    const keyMaterial = await crypto.subtle.importKey("raw", buf(ikm), "HKDF", false, [
      "deriveBits",
    ]);
    const bits = await crypto.subtle.deriveBits(
      { name: "HKDF", hash: "SHA-256", salt: buf(salt), info: buf(info) },
      keyMaterial,
      length * 8,
    );
    return new Uint8Array(bits);
  }

  async aesGcmEncrypt(
    key: Uint8Array,
    plaintext: Uint8Array,
    iv: Uint8Array,
    aad?: Uint8Array,
  ): Promise<Uint8Array> {
    const cryptoKey = await crypto.subtle.importKey("raw", buf(key), "AES-GCM", false, ["encrypt"]);
    const params: AesGcmParams = { name: "AES-GCM", iv: buf(iv) };
    if (aad) params.additionalData = buf(aad);
    const result = await crypto.subtle.encrypt(params, cryptoKey, buf(plaintext));
    return new Uint8Array(result);
  }

  async aesGcmDecrypt(
    key: Uint8Array,
    ciphertext: Uint8Array,
    iv: Uint8Array,
    aad?: Uint8Array,
  ): Promise<Uint8Array> {
    const cryptoKey = await crypto.subtle.importKey("raw", buf(key), "AES-GCM", false, ["decrypt"]);
    const params: AesGcmParams = { name: "AES-GCM", iv: buf(iv) };
    if (aad) params.additionalData = buf(aad);
    const result = await crypto.subtle.decrypt(params, cryptoKey, buf(ciphertext));
    return new Uint8Array(result);
  }

  async pbkdf2(
    password: Uint8Array,
    salt: Uint8Array,
    iterations: number,
    keyLength: number,
  ): Promise<Uint8Array> {
    const keyMaterial = await crypto.subtle.importKey("raw", buf(password), "PBKDF2", false, [
      "deriveBits",
    ]);
    const bits = await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt: buf(salt), iterations, hash: "SHA-256" },
      keyMaterial,
      keyLength * 8,
    );
    return new Uint8Array(bits);
  }
}

export function createWebBackend(): WebCryptoBackend {
  return new WebCryptoBackend();
}
