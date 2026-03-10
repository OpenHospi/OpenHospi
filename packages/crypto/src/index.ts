/**
 * @openhospi/crypto — Signal Protocol-inspired E2EE
 *
 * X3DH key exchange + Double Ratchet with X25519/Ed25519 + AES-256-GCM.
 * Provides forward secrecy, break-in recovery, and MITM detection via safety numbers.
 *
 * Usage:
 *   import { setBackend } from "@openhospi/crypto";
 *   import { createWebBackend } from "@openhospi/crypto/web";
 *   setBackend(createWebBackend());
 */

// ── Platform ──
export { setBackend, getBackend } from "./platform";
export type { CryptoBackend } from "./platform";

// ── Types ──
export type {
  KeyPair,
  IdentityKeyPair,
  SignedPreKey,
  OneTimePreKey,
  PreKeyBundle,
  X3DHResult,
  RatchetState,
  SkippedKeyEntry,
  MessageHeader,
  EncryptedMessage,
  SessionState,
  SerializedRatchetState,
  SerializedSkippedKeyEntry,
} from "./types";

// ── Encoding ──
export { toBase64, fromBase64, concatBytes, bytesEqual } from "./encoding";

// ── Key Generation ──
export {
  generateIdentityKeyPair,
  generateSignedPreKey,
  generateOneTimePreKeys,
  verifySignedPreKey,
} from "./keys";

// ── X3DH Key Exchange ──
export { x3dhInitiate, x3dhRespond } from "./x3dh";

// ── Double Ratchet ──
export {
  initializeSender,
  initializeReceiver,
  ratchetEncrypt,
  ratchetDecrypt,
  serializeRatchetState,
  deserializeRatchetState,
} from "./double-ratchet";

// ── KDF Chain ──
export { kdfChainStep, kdfRootStep } from "./kdf-chain";

// ── Encryption ──
export { encrypt, decrypt, encodeHeaderAsAad } from "./encryption";

// ── Safety Numbers ──
export { generateSafetyNumber } from "./safety-number";

// ── Backup ──
export { deriveKeyFromPIN, encryptIdentityBackup, decryptIdentityBackup } from "./backup";
export type { IdentityBackupData, EncryptedBackup } from "./backup";
