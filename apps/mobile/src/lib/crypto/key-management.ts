import {
  deriveKeyFromPIN,
  encryptPrivateKeyBackup,
  decryptPrivateKeyBackup,
  exportPrivateKey,
  exportPublicKey,
  generateKeyPair,
  importPrivateKey,
  toBase64,
  fromBase64,
} from '@openhospi/crypto';
import { PBKDF2_ITERATIONS } from '@openhospi/shared/constants';

import { deleteStoredPrivateKey, getStoredPrivateKey, storePrivateKey } from './store';

export type KeyStatus = 'ready' | 'needs-recovery' | 'needs-setup';

export async function getKeyStatus(
  userId: string,
  fetchBackup: () => Promise<{ salt: string } | null>
): Promise<KeyStatus> {
  const storedJwk = await getStoredPrivateKey(userId);
  if (storedJwk) return 'ready';

  const backup = await fetchBackup();
  if (backup) return 'needs-recovery';

  return 'needs-setup';
}

export async function setupKeysWithPIN(
  userId: string,
  pin: string,
  uploadPublicKey: (jwk: JsonWebKey) => Promise<void>,
  uploadBackup: (data: {
    encryptedPrivateKey: string;
    backupIv: string;
    salt: string;
  }) => Promise<void>
): Promise<void> {
  const keyPair = await generateKeyPair();
  const publicKeyJwk = await exportPublicKey(keyPair.publicKey);
  const privateKeyJwk = await exportPrivateKey(keyPair.privateKey);

  const salt = crypto.getRandomValues(new Uint8Array(32));
  const wrappingKey = await deriveKeyFromPIN(pin, salt, PBKDF2_ITERATIONS);

  const backup = await encryptPrivateKeyBackup(privateKeyJwk, wrappingKey);

  await uploadPublicKey(publicKeyJwk);
  await uploadBackup({
    encryptedPrivateKey: backup.ciphertext,
    backupIv: backup.iv,
    salt: toBase64(salt),
  });

  await storePrivateKey(userId, privateKeyJwk);
}

export async function recoverKeysWithPIN(
  userId: string,
  pin: string,
  backup: { encryptedPrivateKey: string; backupIv: string; salt: string }
): Promise<void> {
  const salt = fromBase64(backup.salt);
  const wrappingKey = await deriveKeyFromPIN(pin, salt, PBKDF2_ITERATIONS);

  const privateKeyJwk = await decryptPrivateKeyBackup(
    backup.encryptedPrivateKey,
    backup.backupIv,
    wrappingKey
  );

  await storePrivateKey(userId, privateKeyJwk);
}

export async function resetKeys(
  userId: string,
  uploadPublicKey: (jwk: JsonWebKey) => Promise<void>,
  deleteBackup: () => Promise<void>
): Promise<void> {
  await deleteStoredPrivateKey(userId);
  await deleteBackup();

  const keyPair = await generateKeyPair();
  const publicKeyJwk = await exportPublicKey(keyPair.publicKey);
  const privateKeyJwk = await exportPrivateKey(keyPair.privateKey);

  await uploadPublicKey(publicKeyJwk);
  await storePrivateKey(userId, privateKeyJwk);
}

export async function importAndStoreKey(userId: string): Promise<CryptoKey | null> {
  const storedJwk = await getStoredPrivateKey(userId);
  if (!storedJwk) return null;
  return importPrivateKey(storedJwk);
}
