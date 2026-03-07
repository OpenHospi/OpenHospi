import QuickCrypto from 'react-native-quick-crypto';

// Register react-native-quick-crypto as the global crypto implementation.
// This must be imported before any code that uses crypto.subtle (E2EE).
if (typeof globalThis.crypto === 'undefined') {
  // @ts-expect-error -- QuickCrypto is a compatible polyfill for the Web Crypto API
  globalThis.crypto = QuickCrypto;
} else if (typeof globalThis.crypto.subtle === 'undefined') {
  // @ts-expect-error -- Polyfill subtle only if missing
  globalThis.crypto.subtle = QuickCrypto.subtle;
}
