/**
 * Mobile-specific key setup and recovery.
 * Bridges the crypto package (pure functions) with mobile storage and server APIs.
 */
import {
  setCryptoProvider,
  generateIdentityKeyPair,
  generateRegistrationId,
  generateSignedPreKey,
  generateOneTimePreKeys,
  encryptIdentityBackup,
  decryptIdentityBackup,
  toBase64,
  fromBase64,
} from '@openhospi/crypto';
import { createNativeCryptoProvider } from '@openhospi/crypto/native';
import type { EncryptedBackup } from '@openhospi/crypto';

import { getMobileSignalStore } from '../crypto/stores';

let providerInitialized = false;

function ensureCryptoProvider() {
  if (!providerInitialized) {
    setCryptoProvider(createNativeCryptoProvider());
    providerInitialized = true;
  }
}

const DEFAULT_PREKEY_COUNT = 100;

/**
 * Generate all keys, store locally in SQLite, and create a PIN-encrypted backup.
 * Returns public data for server upload.
 */
export async function setupKeysWithPIN(pin: string) {
  ensureCryptoProvider();
  const store = getMobileSignalStore();

  const identity = generateIdentityKeyPair();
  const registrationId = generateRegistrationId();
  const signedPreKey = generateSignedPreKey(identity.signingKeyPair.privateKey, 1);
  const oneTimePreKeys = generateOneTimePreKeys(1, DEFAULT_PREKEY_COUNT);

  // Store identity key pair in encrypted SQLite
  await store.storeIdentityKeyPair(identity, registrationId);

  // Store prekeys
  await store.storeSignedPreKey(signedPreKey.keyId, signedPreKey);
  for (const pk of oneTimePreKeys) {
    await store.storePreKey(pk.keyId, pk);
  }

  // Create encrypted backup
  const encryptedBackup = await encryptIdentityBackup(
    {
      signingPublicKey: toBase64(identity.signingKeyPair.publicKey),
      signingPrivateKey: toBase64(identity.signingKeyPair.privateKey),
      registrationId,
    },
    pin
  );

  return {
    registrationId,
    identityKeyPublic: toBase64(identity.dhKeyPair.publicKey),
    signingKeyPublic: toBase64(identity.signingKeyPair.publicKey),
    signedPreKey: {
      keyId: signedPreKey.keyId,
      publicKey: toBase64(signedPreKey.keyPair.publicKey),
      signature: toBase64(signedPreKey.signature),
    },
    oneTimePreKeys: oneTimePreKeys.map((pk) => ({
      keyId: pk.keyId,
      publicKey: toBase64(pk.keyPair.publicKey),
    })),
    encryptedBackup,
  };
}

/**
 * Recover identity from encrypted backup, regenerate prekeys, and store locally.
 * Returns public data for server upload.
 */
export async function recoverKeysWithPIN(backup: EncryptedBackup, pin: string) {
  ensureCryptoProvider();
  const store = getMobileSignalStore();

  const recovered = await decryptIdentityBackup(backup, pin);
  const signingPublicKey = fromBase64(recovered.signingPublicKey);
  const signingPrivateKey = fromBase64(recovered.signingPrivateKey);

  // Re-derive the X25519 DH key pair from Ed25519 signing keys
  const { getCryptoProvider } = await import('@openhospi/crypto');
  const crypto = getCryptoProvider();
  const dhPublicKey = crypto.edToX25519Public(signingPublicKey);
  const dhPrivateKey = crypto.edToX25519Private(signingPrivateKey);

  // Store identity
  await store.storeIdentityKeyPair(
    {
      signingKeyPair: { publicKey: signingPublicKey, privateKey: signingPrivateKey },
      dhKeyPair: { publicKey: dhPublicKey, privateKey: dhPrivateKey },
    },
    recovered.registrationId
  );

  // Generate new prekeys
  const signedPreKey = generateSignedPreKey(signingPrivateKey, 1);
  const oneTimePreKeys = generateOneTimePreKeys(1, DEFAULT_PREKEY_COUNT);

  await store.storeSignedPreKey(signedPreKey.keyId, signedPreKey);
  for (const pk of oneTimePreKeys) {
    await store.storePreKey(pk.keyId, pk);
  }

  return {
    registrationId: recovered.registrationId,
    identityKeyPublic: toBase64(dhPublicKey),
    signingKeyPublic: recovered.signingPublicKey,
    signedPreKey: {
      keyId: signedPreKey.keyId,
      publicKey: toBase64(signedPreKey.keyPair.publicKey),
      signature: toBase64(signedPreKey.signature),
    },
    oneTimePreKeys: oneTimePreKeys.map((pk) => ({
      keyId: pk.keyId,
      publicKey: toBase64(pk.keyPair.publicKey),
    })),
  };
}
