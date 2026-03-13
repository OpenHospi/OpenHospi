import {
  x25519,
  ed25519,
  edwardsToMontgomeryPub,
  edwardsToMontgomeryPriv,
} from "@noble/curves/ed25519";

import type { CryptoProvider } from "./CryptoProvider";

/**
 * React Native crypto provider using @noble/curves + react-native-quick-crypto.
 *
 * react-native-quick-crypto must be installed and polyfilled in the app's
 * entry point before this provider is used. It provides the Node.js `crypto`
 * API via JSI (C++ native bindings, NOT a JS polyfill).
 *
 * Usage:
 *   import { createNativeCryptoProvider } from "@openhospi/crypto/native";
 *   import { setCryptoProvider } from "@openhospi/crypto";
 *   setCryptoProvider(createNativeCryptoProvider());
 */
export function createNativeCryptoProvider(): CryptoProvider {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const QuickCrypto = require("react-native-quick-crypto") as typeof import("crypto");

  return {
    randomBytes(length: number): Uint8Array {
      return new Uint8Array(QuickCrypto.randomBytes(length));
    },

    // ── X25519 DH (@noble/curves — same as web) ──

    x25519GenerateKeyPair() {
      const privateKey = x25519.utils.randomPrivateKey();
      const publicKey = x25519.getPublicKey(privateKey);
      return { publicKey, privateKey };
    },

    x25519SharedSecret(privateKey: Uint8Array, publicKey: Uint8Array): Uint8Array {
      return x25519.getSharedSecret(privateKey, publicKey);
    },

    // ── Ed25519 Signatures (@noble/curves — same as web) ──

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

    // ── Ed25519 ↔ X25519 Conversion (@noble/curves) ──

    edToX25519Public(edPublicKey: Uint8Array): Uint8Array {
      return edwardsToMontgomeryPub(edPublicKey);
    },

    edToX25519Private(edPrivateKey: Uint8Array): Uint8Array {
      return edwardsToMontgomeryPriv(edPrivateKey);
    },

    // ── Symmetric Crypto (react-native-quick-crypto — sync, wrapped async) ──

    async hmacSha256(key: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
      const hmac = QuickCrypto.createHmac("sha256", Buffer.from(key));
      hmac.update(Buffer.from(data));
      return new Uint8Array(hmac.digest());
    },

    async hkdf(
      ikm: Uint8Array,
      salt: Uint8Array,
      info: Uint8Array,
      length: number,
    ): Promise<Uint8Array> {
      return new Promise((resolve, reject) => {
        QuickCrypto.hkdf(
          "sha256",
          Buffer.from(ikm),
          Buffer.from(salt),
          Buffer.from(info),
          length,
          (err: Error | null, derivedKey: ArrayBuffer) => {
            if (err) reject(err);
            else resolve(new Uint8Array(derivedKey));
          },
        );
      });
    },

    async aesCbcEncrypt(
      key: Uint8Array,
      plaintext: Uint8Array,
      iv: Uint8Array,
    ): Promise<Uint8Array> {
      const cipher = QuickCrypto.createCipheriv("aes-256-cbc", Buffer.from(key), Buffer.from(iv));
      const encrypted = Buffer.concat([cipher.update(Buffer.from(plaintext)), cipher.final()]);
      return new Uint8Array(encrypted);
    },

    async aesCbcDecrypt(
      key: Uint8Array,
      ciphertext: Uint8Array,
      iv: Uint8Array,
    ): Promise<Uint8Array> {
      const decipher = QuickCrypto.createDecipheriv(
        "aes-256-cbc",
        Buffer.from(key),
        Buffer.from(iv),
      );
      const decrypted = Buffer.concat([decipher.update(Buffer.from(ciphertext)), decipher.final()]);
      return new Uint8Array(decrypted);
    },

    async aesGcmEncrypt(
      key: Uint8Array,
      plaintext: Uint8Array,
      iv: Uint8Array,
      aad?: Uint8Array,
    ): Promise<Uint8Array> {
      const cipher = QuickCrypto.createCipheriv(
        "aes-256-gcm",
        Buffer.from(key),
        Buffer.from(iv),
      ) as import("crypto").CipherGCM;
      if (aad) cipher.setAAD(Buffer.from(aad));
      const encrypted = Buffer.concat([cipher.update(Buffer.from(plaintext)), cipher.final()]);
      const tag = cipher.getAuthTag();
      // Append auth tag to ciphertext (same format as Web Crypto)
      return new Uint8Array(Buffer.concat([encrypted, tag]));
    },

    async aesGcmDecrypt(
      key: Uint8Array,
      ciphertext: Uint8Array,
      iv: Uint8Array,
      aad?: Uint8Array,
    ): Promise<Uint8Array> {
      // Auth tag is the last 16 bytes
      const tagStart = ciphertext.length - 16;
      const encData = ciphertext.slice(0, tagStart);
      const tag = ciphertext.slice(tagStart);

      const decipher = QuickCrypto.createDecipheriv(
        "aes-256-gcm",
        Buffer.from(key),
        Buffer.from(iv),
      ) as import("crypto").DecipherGCM;
      decipher.setAuthTag(Buffer.from(tag));
      if (aad) decipher.setAAD(Buffer.from(aad));
      const decrypted = Buffer.concat([decipher.update(Buffer.from(encData)), decipher.final()]);
      return new Uint8Array(decrypted);
    },

    async pbkdf2(
      password: Uint8Array,
      salt: Uint8Array,
      iterations: number,
      keyLength: number,
    ): Promise<Uint8Array> {
      return new Promise((resolve, reject) => {
        QuickCrypto.pbkdf2(
          Buffer.from(password),
          Buffer.from(salt),
          iterations,
          keyLength,
          "sha256",
          (err: Error | null, derivedKey: Buffer) => {
            if (err) reject(err);
            else resolve(new Uint8Array(derivedKey));
          },
        );
      });
    },
  };
}
