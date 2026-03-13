/**
 * @openhospi/crypto — Signal Protocol E2EE
 *
 * Full Signal Protocol implementation: X3DH key agreement, Double Ratchet
 * for 1:1 sessions, Sender Keys for group encryption, safety numbers,
 * and PIN-based key backup.
 *
 * Usage:
 *   // Web
 *   import { setCryptoProvider } from "@openhospi/crypto";
 *   import { createWebCryptoProvider } from "@openhospi/crypto/web";
 *   setCryptoProvider(createWebCryptoProvider());
 *
 *   // Mobile
 *   import { setCryptoProvider } from "@openhospi/crypto";
 *   import { createNativeCryptoProvider } from "@openhospi/crypto/native";
 *   setCryptoProvider(createNativeCryptoProvider());
 */

// ── Platform ──
export { setCryptoProvider, getCryptoProvider } from "./primitives/CryptoProvider";
export type { CryptoProvider } from "./primitives/CryptoProvider";

// ── Types ──
export type {
  KeyPair,
  IdentityKeyPair,
  SignedPreKey,
  OneTimePreKey,
  PreKeyBundle,
  X3DHResult,
  ChainState,
  SessionState,
  WhisperMessage,
  PreKeyWhisperMessage,
  MessageEnvelope,
  SenderKeyState,
  SenderKeyDistributionMessage,
  GroupCiphertextPayload,
  ProtocolAddress,
  SkippedKey,
  SerializedSessionState,
  SerializedSenderKeyState,
} from "./protocol/types";

// ── Encoding ──
export {
  toBase64,
  fromBase64,
  concatBytes,
  bytesEqual,
  utf8ToBytes,
  bytesToUtf8,
} from "./protocol/encoding";

// ── Key Generation ──
export {
  generateIdentityKeyPair,
  generateRegistrationId,
  generateSignedPreKey,
  verifySignedPreKey,
  generateOneTimePreKeys,
} from "./protocol/keys";

// ── X3DH Key Exchange ──
export {
  x3dhInitiate,
  x3dhRespond,
  initializeSessionFromX3DH,
  initializeSessionFromX3DHResponder,
} from "./protocol/x3dh";

// ── Double Ratchet ──
export { ratchetEncrypt, ratchetDecrypt } from "./protocol/double-ratchet";

// ── Session Cipher ──
export { sessionEncrypt, sessionDecrypt } from "./protocol/session-cipher";
export type { SessionEncryptResult, SessionDecryptResult } from "./protocol/session-cipher";

// ── Session Builder ──
export { buildSessionFromPreKeyBundle, processPreKeyMessage } from "./protocol/session-builder";
export type { SessionFromBundleResult } from "./protocol/session-builder";

// ── Sender Key ──
export {
  generateSenderKey,
  createDistributionMessage,
  processDistributionMessage,
  senderKeyEncrypt,
  senderKeyDecrypt,
  serializeSenderKeyState,
  deserializeSenderKeyState,
  serializeDistributionMessage,
  deserializeDistributionMessage,
  StaleSenderKeyError,
} from "./protocol/sender-key";

// ── Group Cipher ──
export { groupEncrypt, groupDecrypt } from "./protocol/group-cipher";

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

// ── Store Interfaces ──
export type {
  IdentityKeyStore,
  PreKeyStore,
  SignedPreKeyStore,
  SessionStore,
  SenderKeyStore,
  SkippedKeyStore,
  SignalProtocolStore,
} from "./stores/types";

// ── Manager: Key Lifecycle ──
export {
  getKeyStatus,
  setupKeysWithPIN,
  recoverKeysWithPIN,
  replenishOneTimePreKeys,
  rotateSignedPreKey,
} from "./manager/KeyManager";
export type { KeyStatus } from "./manager/KeyManager";

// ── Manager: Session Management ──
export {
  establishSession,
  processIncomingPreKeyMessage,
  encryptForSession,
  decryptFromSession,
} from "./manager/SessionManager";

// ── Manager: Group Encryption ──
export {
  getOrCreateSenderKey,
  distributeSenderKeyToDevice,
  receiveSenderKeyDistribution,
  encryptGroupMessage,
  decryptGroupMessage,
  rotateSenderKey,
} from "./manager/GroupEncryptionManager";
