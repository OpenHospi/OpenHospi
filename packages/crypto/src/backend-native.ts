/**
 * React Native crypto backend using react-native-quick-crypto.
 *
 * Provides OpenSSL 3.6+ via Nitro Modules with full Node.js crypto API.
 * Curve operations are synchronous; AES/HKDF/PBKDF2 return resolved Promises
 * to match the async CryptoBackend interface.
 */
import type { CryptoBackend } from "./platform";
import type { KeyPair } from "./types";

// react-native-quick-crypto provides Node.js-compatible crypto
// eslint-disable-next-line @typescript-eslint/no-require-imports
const QuickCrypto = require("react-native-quick-crypto");

export class NativeCryptoBackend implements CryptoBackend {
  generateX25519KeyPair(): KeyPair {
    const { publicKey, privateKey } = QuickCrypto.generateKeyPairSync("x25519");
    return {
      publicKey: extractRawPublicKey(publicKey),
      privateKey: extractRawPrivateKey(privateKey),
    };
  }

  x25519(privateKey: Uint8Array, publicKey: Uint8Array): Uint8Array {
    const ecdh = QuickCrypto.createECDH("x25519");
    ecdh.setPrivateKey(Buffer.from(privateKey));
    return new Uint8Array(ecdh.computeSecret(Buffer.from(publicKey)));
  }

  generateEd25519KeyPair(): KeyPair {
    const { publicKey, privateKey } = QuickCrypto.generateKeyPairSync("ed25519");
    return {
      publicKey: extractRawPublicKey(publicKey),
      privateKey: extractRawPrivateKey(privateKey),
    };
  }

  ed25519Sign(privateKey: Uint8Array, message: Uint8Array): Uint8Array {
    return new Uint8Array(
      QuickCrypto.sign(null, Buffer.from(message), {
        key: Buffer.from(privateKey),
        format: "der",
        type: "pkcs8",
      }),
    );
  }

  ed25519Verify(publicKey: Uint8Array, message: Uint8Array, signature: Uint8Array): boolean {
    try {
      return QuickCrypto.verify(
        null,
        Buffer.from(message),
        {
          key: Buffer.from(publicKey),
          format: "der",
          type: "spki",
        },
        Buffer.from(signature),
      );
    } catch {
      return false;
    }
  }

  edToX25519Public(edPublicKey: Uint8Array): Uint8Array {
    const keyObj = QuickCrypto.createPublicKey({
      key: Buffer.from(edPublicKey),
      format: "der",
      type: "spki",
    });
    const converted = keyObj.convert("x25519");
    return extractRawPublicKey(converted.export({ type: "spki", format: "der" }));
  }

  edToX25519Private(edPrivateKey: Uint8Array): Uint8Array {
    const keyObj = QuickCrypto.createPrivateKey({
      key: Buffer.from(edPrivateKey),
      format: "der",
      type: "pkcs8",
    });
    const converted = keyObj.convert("x25519");
    return extractRawPrivateKey(converted.export({ type: "pkcs8", format: "der" }));
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

function extractRawPublicKey(derBuffer: Buffer): Uint8Array {
  // X25519/Ed25519 SPKI DER: last 32 bytes are the raw public key
  return new Uint8Array(derBuffer.slice(-32));
}

function extractRawPrivateKey(derBuffer: Buffer): Uint8Array {
  // X25519/Ed25519 PKCS8 DER: last 32 bytes are the raw private key
  return new Uint8Array(derBuffer.slice(-32));
}

export function createNativeBackend(): NativeCryptoBackend {
  return new NativeCryptoBackend();
}
