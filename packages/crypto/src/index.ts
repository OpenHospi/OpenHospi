/**
 * @openhospi/crypto — Signal Sender Keys E2EE
 *
 * X3DH key exchange for Sender Key distribution + HMAC chain ratchet with
 * X25519/Ed25519 + AES-256-GCM. Provides forward secrecy and MITM detection
 * via safety numbers.
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
  SenderKeyState,
  SerializedSenderKeyState,
  SenderKeyDistributionData,
  GroupCiphertextPayload,
  SenderKeyDistributionEnvelope,
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

// ── Sender Key Chain ──
export { senderKeyChainStep, fastForwardChain } from "./protocol/sender-key-chain";

// ── Sender Key ──
export {
  generateSenderKey,
  senderKeyEncrypt,
  senderKeyDecrypt,
  serializeSenderKeyState,
  deserializeSenderKeyState,
} from "./protocol/sender-key";

// ── Encryption ──
export { encrypt, decrypt, encodeGroupAad, encodeSignatureData } from "./protocol/encryption";

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
  getOrCreateOwnSenderKey,
  distributeSenderKey,
  receiveSenderKeyDistribution,
} from "./manager/key-management";
export type { KeyStatus } from "./manager/key-management";

// ── Manager: Encryption Operations ──
export {
  encryptGroupMessage,
  decryptGroupMessage,
  getIdentityFingerprint,
} from "./manager/encryption-ops";
export type { FingerprintResult } from "./manager/encryption-ops";
