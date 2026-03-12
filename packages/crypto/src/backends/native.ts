/**
 * React Native crypto backend.
 *
 * Uses @noble/curves for all Ed25519/X25519 operations — identical to the web
 * backend — so key formats and signatures are 100% interoperable between platforms.
 *
 * Uses react-native-quick-crypto (OpenSSL via Nitro Modules) for symmetric
 * operations (AES-256-GCM, HKDF, PBKDF2) and randomBytes where native
 * performance matters.
 */
import { ed25519, x25519 } from "@noble/curves/ed25519.js";

import type { KeyPair } from "../protocol/types";

import type { CryptoBackend } from "./platform";

// react-native-quick-crypto provides Node.js-compatible crypto
// eslint-disable-next-line @typescript-eslint/no-require-imports
const QuickCrypto = require("react-native-quick-crypto");

export class NativeCryptoBackend implements CryptoBackend {
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
    return new Uint8Array(QuickCrypto.randomBytes(length));
  }

  async hkdf(
    ikm: Uint8Array,
    salt: Uint8Array,
    info: Uint8Array,
    length: number,
  ): Promise<Uint8Array> {
    return new Uint8Array(
      QuickCrypto.hkdfSync(
        "sha256",
        Buffer.from(ikm),
        Buffer.from(salt),
        Buffer.from(info),
        length,
      ),
    );
  }

  async aesGcmEncrypt(
    key: Uint8Array,
    plaintext: Uint8Array,
    iv: Uint8Array,
    aad?: Uint8Array,
  ): Promise<Uint8Array> {
    const cipher = QuickCrypto.createCipheriv("aes-256-gcm", Buffer.from(key), Buffer.from(iv));
    if (aad) cipher.setAAD(Buffer.from(aad));
    const encrypted = Buffer.concat([cipher.update(Buffer.from(plaintext)), cipher.final()]);
    const tag = cipher.getAuthTag();
    const result = new Uint8Array(encrypted.length + tag.length);
    result.set(new Uint8Array(encrypted));
    result.set(new Uint8Array(tag), encrypted.length);
    return result;
  }

  async aesGcmDecrypt(
    key: Uint8Array,
    ciphertext: Uint8Array,
    iv: Uint8Array,
    aad?: Uint8Array,
  ): Promise<Uint8Array> {
    const tagStart = ciphertext.length - 16;
    const data = ciphertext.slice(0, tagStart);
    const tag = ciphertext.slice(tagStart);
    const decipher = QuickCrypto.createDecipheriv("aes-256-gcm", Buffer.from(key), Buffer.from(iv));
    decipher.setAuthTag(Buffer.from(tag));
    if (aad) decipher.setAAD(Buffer.from(aad));
    const decrypted = Buffer.concat([decipher.update(Buffer.from(data)), decipher.final()]);
    return new Uint8Array(decrypted);
  }

  async hmacSha256(key: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
    const hmac = QuickCrypto.createHmac("sha256", Buffer.from(key));
    hmac.update(Buffer.from(data));
    return new Uint8Array(hmac.digest());
  }

  async pbkdf2(
    password: Uint8Array,
    salt: Uint8Array,
    iterations: number,
    keyLength: number,
  ): Promise<Uint8Array> {
    return new Uint8Array(
      QuickCrypto.pbkdf2Sync(
        Buffer.from(password),
        Buffer.from(salt),
        iterations,
        keyLength,
        "sha256",
      ),
    );
  }
}

export function createNativeBackend(): NativeCryptoBackend {
  return new NativeCryptoBackend();
}
