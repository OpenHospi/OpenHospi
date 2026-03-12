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
export { setBackend, getBackend } from "./backends/platform";
export type { CryptoBackend } from "./backends/platform";

// ── Types ──
export type {
  KeyPair,
  IdentityKeyPair,
  SignedPreKey,
  OneTimePreKey,
  PreKeyBundle,
  ServerPreKeyBundle,
  X3DHResult,
  RatchetState,
  SkippedKeyEntry,
  MessageHeader,
  EncryptedMessage,
  SessionState,
  SerializedRatchetState,
  SerializedSkippedKeyEntry,
} from "./protocol/types";

// ── Encoding ──
export { toBase64, fromBase64, concatBytes, bytesEqual } from "./protocol/encoding";

// ── Key Generation ──
export {
  generateIdentityKeyPair,
  generateSignedPreKey,
  generateOneTimePreKeys,
  verifySignedPreKey,
} from "./protocol/keys";

// ── X3DH Key Exchange ──
export { x3dhInitiate, x3dhRespond } from "./protocol/x3dh";

// ── Double Ratchet ──
export {
  initializeSender,
  initializeReceiver,
  ratchetEncrypt,
  ratchetDecrypt,
  serializeRatchetState,
  deserializeRatchetState,
} from "./protocol/double-ratchet";

// ── KDF Chain ──
export { kdfChainStep, kdfRootStep } from "./protocol/kdf-chain";

// ── Encryption ──
export { encrypt, decrypt, encodeHeaderAsAad } from "./protocol/encryption";

// ── Safety Numbers ──
export {
  generateSafetyNumber,
  encodeSafetyNumberQR,
  verifySafetyNumberQR,
} from "./protocol/safety-number";
export type { QRVerifyResult } from "./protocol/safety-number";

// ── Backup ──
export { deriveKeyFromPIN, encryptIdentityBackup, decryptIdentityBackup } from "./protocol/backup";
export type { IdentityBackupData, EncryptedBackup } from "./protocol/backup";

// ── Store ──
export type {
  CryptoStore,
  StoredIdentity,
  StoredSignedPreKey,
  StoredOneTimePreKey,
} from "./store/types";

// ── Manager: Key Management ──
export {
  getKeyStatus,
  setupKeysWithPIN,
  recoverKeysWithPIN,
  resetKeys,
  replenishOneTimePreKeys,
  getOrCreateSession,
  createSessionAsResponder,
} from "./manager/key-management";
export type { KeyStatus, X3DHSessionMeta } from "./manager/key-management";

// ── Manager: Encryption Operations ──
export {
  encryptForRecipient,
  decryptFromSender,
  encryptForSelf,
  decryptForSelf,
  getIdentityFingerprint,
} from "./manager/encryption-ops";
export type {
  CiphertextPayload,
  EncryptResult,
  X3DHMetadata,
  FingerprintResult,
} from "./manager/encryption-ops";
