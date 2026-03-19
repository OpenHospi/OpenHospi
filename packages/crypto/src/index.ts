// Primitives
export { setCryptoProvider, getCryptoProvider } from "./primitives/CryptoProvider";
export type { CryptoProvider } from "./primitives/CryptoProvider";

// Protocol types
export type {
  KeyPair,
  ProtocolAddress,
  PreKeyBundle,
  SessionState,
  SessionRecord,
  PreKeyRecord,
  SignedPreKeyRecord,
  SenderKeyState,
  SenderKeyRecord,
  SenderKeyDistributionMessage,
  PreKeyWhisperMessage,
  WhisperMessage,
  SenderKeyMessageData,
  EncryptedBackup,
} from "./protocol/types";

// Encoding utilities
export {
  toBase64,
  fromBase64,
  encodeUtf8,
  decodeUtf8,
  concat,
  timingSafeEqual,
} from "./protocol/encoding";

// Key generation
export {
  generateIdentityKeyPair,
  generateRegistrationId,
  generateSignedPreKey,
  generatePreKeys,
  generateX25519KeyPair,
  generateEd25519KeyPair,
  ed25519Sign,
  ed25519Verify,
  x25519Dh,
} from "./protocol/keys";

// X3DH
export { x3dhInitiate, x3dhRespond } from "./protocol/x3dh";
export type { X3DHResult } from "./protocol/x3dh";

// Double Ratchet
export {
  ratchetEncrypt,
  ratchetDecrypt,
  initSessionAsInitiator,
  initSessionAsResponder,
} from "./protocol/double-ratchet";

// Session
export { buildSessionFromBundle } from "./protocol/session-builder";
export {
  sessionEncrypt,
  sessionDecrypt,
  createPreKeyMessage,
  isPreKeyWhisperMessage,
  deserializePreKeyWhisperMessage,
  deserializeWhisperMessage,
} from "./protocol/session-cipher";

// Sender Key / Group
export {
  generateSenderKeyState,
  createDistributionMessage,
  serializeDistributionMessage,
  deserializeDistributionMessage,
  senderKeyEncrypt,
  senderKeyDecrypt,
} from "./protocol/sender-key";
export { initGroupSenderKey, groupEncrypt, groupDecrypt } from "./protocol/group-cipher";

// Safety Number
export {
  generateSafetyNumber,
  encodeSafetyNumberQR,
  verifySafetyNumberQR,
} from "./protocol/safety-number";

// Managers
export { setupDevice, recoverFromBackup } from "./manager/KeyManager";
export type { DeviceSetupResult } from "./manager/KeyManager";
export { establishSession, encrypt1to1, decrypt1to1 } from "./manager/SessionManager";
export {
  initAndDistributeSenderKey,
  processDistribution,
  encryptGroupMessage,
  decryptGroupMessage,
} from "./manager/GroupEncryptionManager";

// Key Maintenance (hardening)
export { replenishPreKeysIfNeeded, rotateSignedPreKeyIfNeeded } from "./manager/KeyMaintenance";
export type { KeyMaintenanceActions } from "./manager/KeyMaintenance";

// Sender Key Rotation (hardening)
export {
  shouldRotateSenderKey,
  invalidateSenderKey,
  invalidateRemovedMemberKeys,
} from "./manager/SenderKeyRotation";

// Decryption Queue (hardening)
export { DecryptionQueue } from "./manager/DecryptionQueue";
export type { QueuedMessage } from "./manager/DecryptionQueue";

// Store types
export type {
  IdentityKeyStore,
  PreKeyStore,
  SignedPreKeyStore,
  SessionStore,
  SenderKeyStore,
  ProtocolStore,
} from "./stores/types";
