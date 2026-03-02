"use client";

import {
  deriveKeyFromPIN,
  deriveKeyFromPRF,
  encryptPrivateKeyBackup,
  decryptPrivateKeyBackup,
  exportPrivateKey,
  exportPublicKey,
  generateKeyPair,
  importPrivateKey,
  toBase64,
  fromBase64,
} from "@openhospi/crypto";
import { PBKDF2_ITERATIONS } from "@openhospi/shared/constants";

import { deleteStoredPrivateKey, getStoredPrivateKey, storePrivateKey } from "./crypto-store";
import { authenticateEncryptionPasskey, registerEncryptionPasskey } from "./passkey-crypto";

export type KeyStatus = "ready" | "needs-recovery" | "needs-setup";

export async function getKeyStatus(
  userId: string,
  fetchBackup: () => Promise<{ backupType: string } | null>,
): Promise<KeyStatus> {
  const storedJwk = await getStoredPrivateKey(userId);
  if (storedJwk) return "ready";

  const backup = await fetchBackup();
  if (backup) return "needs-recovery";

  return "needs-setup";
}

export async function setupKeysWithPasskey(
  userId: string,
  generateRegistration: () => Promise<
    import("@simplewebauthn/browser").PublicKeyCredentialCreationOptionsJSON
  >,
  verifyRegistration: (
    response: import("@simplewebauthn/browser").RegistrationResponseJSON,
  ) => Promise<{ verified: boolean }>,
  uploadPublicKey: (jwk: JsonWebKey) => Promise<void>,
  uploadBackup: (data: {
    encryptedPrivateKey: string;
    backupIv: string;
    backupType: "passkey" | "pin";
    salt: string;
  }) => Promise<void>,
): Promise<void> {
  // Generate new key pair
  const keyPair = await generateKeyPair();
  const publicKeyJwk = await exportPublicKey(keyPair.publicKey);
  const privateKeyJwk = await exportPrivateKey(keyPair.privateKey);

  // Register passkey with PRF
  const registrationOptions = await generateRegistration();
  const { response, prfOutput } = await registerEncryptionPasskey(registrationOptions);

  // Verify registration on server
  await verifyRegistration(response);

  // Generate salt and derive wrapping key
  const salt = crypto.getRandomValues(new Uint8Array(32));

  let wrappingKey: CryptoKey;
  if (prfOutput) {
    // PRF succeeded during registration — use it
    wrappingKey = await deriveKeyFromPRF(prfOutput, salt);
  } else {
    // PRF not available during registration (expected on some browsers).
    // We need to do an authentication ceremony to get PRF output.
    // For now, throw — the caller should fall back to PIN setup.
    throw new Error("PRF_NOT_AVAILABLE_AT_REGISTRATION");
  }

  // Encrypt private key
  const backup = await encryptPrivateKeyBackup(privateKeyJwk, wrappingKey);

  // Upload to server
  await uploadPublicKey(publicKeyJwk);
  await uploadBackup({
    encryptedPrivateKey: backup.ciphertext,
    backupIv: backup.iv,
    backupType: "passkey",
    salt: toBase64(salt),
  });

  // Store locally
  await storePrivateKey(userId, privateKeyJwk);
}

export async function setupKeysWithPIN(
  userId: string,
  pin: string,
  uploadPublicKey: (jwk: JsonWebKey) => Promise<void>,
  uploadBackup: (data: {
    encryptedPrivateKey: string;
    backupIv: string;
    backupType: "passkey" | "pin";
    salt: string;
  }) => Promise<void>,
): Promise<void> {
  // Generate new key pair
  const keyPair = await generateKeyPair();
  const publicKeyJwk = await exportPublicKey(keyPair.publicKey);
  const privateKeyJwk = await exportPrivateKey(keyPair.privateKey);

  // Derive wrapping key from PIN
  const salt = crypto.getRandomValues(new Uint8Array(32));
  const wrappingKey = await deriveKeyFromPIN(pin, salt, PBKDF2_ITERATIONS);

  // Encrypt private key
  const backup = await encryptPrivateKeyBackup(privateKeyJwk, wrappingKey);

  // Upload to server
  await uploadPublicKey(publicKeyJwk);
  await uploadBackup({
    encryptedPrivateKey: backup.ciphertext,
    backupIv: backup.iv,
    backupType: "pin",
    salt: toBase64(salt),
  });

  // Store locally
  await storePrivateKey(userId, privateKeyJwk);
}

export async function recoverKeysWithPasskey(
  userId: string,
  backup: { encryptedPrivateKey: string; backupIv: string; salt: string },
  generateAuthentication: () => Promise<
    import("@simplewebauthn/browser").PublicKeyCredentialRequestOptionsJSON
  >,
  verifyAuthentication: (
    response: import("@simplewebauthn/browser").AuthenticationResponseJSON,
  ) => Promise<{ verified: boolean }>,
): Promise<void> {
  const salt = fromBase64(backup.salt);

  // Authenticate with passkey to get PRF output
  const authOptions = await generateAuthentication();
  const { response, prfOutput } = await authenticateEncryptionPasskey(authOptions, salt);

  // Verify on server
  await verifyAuthentication(response);

  // Derive wrapping key and decrypt
  const wrappingKey = await deriveKeyFromPRF(prfOutput, salt);
  const privateKeyJwk = await decryptPrivateKeyBackup(
    backup.encryptedPrivateKey,
    backup.backupIv,
    wrappingKey,
  );

  // Store locally
  await storePrivateKey(userId, privateKeyJwk);
}

export async function recoverKeysWithPIN(
  userId: string,
  pin: string,
  backup: { encryptedPrivateKey: string; backupIv: string; salt: string },
): Promise<void> {
  const salt = fromBase64(backup.salt);
  const wrappingKey = await deriveKeyFromPIN(pin, salt, PBKDF2_ITERATIONS);

  const privateKeyJwk = await decryptPrivateKeyBackup(
    backup.encryptedPrivateKey,
    backup.backupIv,
    wrappingKey,
  );

  // Store locally
  await storePrivateKey(userId, privateKeyJwk);
}

export async function resetKeys(
  userId: string,
  uploadPublicKey: (jwk: JsonWebKey) => Promise<void>,
  deleteBackup: () => Promise<void>,
): Promise<void> {
  // Delete old local key
  await deleteStoredPrivateKey(userId);

  // Delete old backup and credential from server
  await deleteBackup();

  // Generate fresh key pair
  const keyPair = await generateKeyPair();
  const publicKeyJwk = await exportPublicKey(keyPair.publicKey);
  const privateKeyJwk = await exportPrivateKey(keyPair.privateKey);

  // Upload new public key (replaces old one via upsert)
  await uploadPublicKey(publicKeyJwk);

  // Store new private key locally (backup will be set up separately)
  await storePrivateKey(userId, privateKeyJwk);
}

export async function importAndStoreKey(userId: string): Promise<CryptoKey | null> {
  const storedJwk = await getStoredPrivateKey(userId);
  if (!storedJwk) return null;
  return importPrivateKey(storedJwk);
}
