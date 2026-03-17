import { cbc } from "@noble/ciphers/aes.js";
import { hkdf } from "@noble/hashes/hkdf.js";
import { hmac } from "@noble/hashes/hmac.js";
import { sha256 } from "@noble/hashes/sha2.js";

import type { CryptoProvider } from "./CryptoProvider";

/**
 * CryptoProvider implementation for React Native / Expo.
 * Uses @noble/hashes + @noble/ciphers which are pure JS and work on all platforms.
 * react-native-quick-crypto is installed for the polyfill but noble handles the crypto.
 */
export function createNativeCryptoProvider(): CryptoProvider {
  return {
    randomBytes(length: number): Uint8Array {
      const buf = new Uint8Array(length);
      // react-native-quick-crypto polyfills global.crypto
      crypto.getRandomValues(buf);
      return buf;
    },

    hmacSha256(key: Uint8Array, data: Uint8Array): Uint8Array {
      return hmac(sha256, key, data);
    },

    hkdf(ikm: Uint8Array, salt: Uint8Array, info: Uint8Array, length: number): Uint8Array {
      return hkdf(sha256, ikm, salt, info, length);
    },

    aesCbcEncrypt(key: Uint8Array, iv: Uint8Array, plaintext: Uint8Array): Uint8Array {
      const cipher = cbc(key, iv);
      return cipher.encrypt(plaintext);
    },

    aesCbcDecrypt(key: Uint8Array, iv: Uint8Array, ciphertext: Uint8Array): Uint8Array {
      const cipher = cbc(key, iv);
      return cipher.decrypt(ciphertext);
    },
  };
}
