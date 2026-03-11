import {
  generateIdentityKeyPair,
  generateSignedPreKey,
  generateOneTimePreKeys,
  toBase64,
  fromBase64,
  encryptIdentityBackup,
  decryptIdentityBackup,
  getBackend,
  x3dhInitiate,
  initializeSender,
  serializeRatchetState,
  deserializeRatchetState,
} from '@openhospi/crypto';
import type { PreKeyBundle, RatchetState } from '@openhospi/crypto';
import {
  ONE_TIME_PRE_KEY_BATCH_SIZE,
  ONE_TIME_PRE_KEY_REFILL_THRESHOLD,
} from '@openhospi/shared/constants';

import {
  clearAllCryptoData,
  getSession,
  getStoredIdentity,
  saveSession,
  storeIdentity,
  storeOneTimePreKeys,
  storeSignedPreKey,
} from './store';
import type { StoredIdentity } from './store';

export type KeyStatus = 'ready' | 'needs-recovery' | 'needs-setup';

export async function getKeyStatus(
  userId: string,
  fetchBackup: () => Promise<{ salt: string } | null>
): Promise<KeyStatus> {
  const stored = await getStoredIdentity(userId);
  if (stored) return 'ready';

  const backup = await fetchBackup();
  if (backup) return 'needs-recovery';

  return 'needs-setup';
}

export async function setupKeysWithPIN(
  userId: string,
  pin: string,
  actions: {
    uploadIdentityKey: (identityPub: string, signingPub: string) => Promise<void>;
    uploadSignedPreKey: (data: {
      keyId: number;
      publicKey: string;
      signature: string;
    }) => Promise<void>;
    uploadOneTimePreKeys: (keys: { keyId: number; publicKey: string }[]) => Promise<void>;
    uploadBackup: (data: {
      encryptedPrivateKey: string;
      backupIv: string;
      salt: string;
    }) => Promise<void>;
  }
): Promise<void> {
  const backend = getBackend();

  const identity = generateIdentityKeyPair(backend);
  const spk = generateSignedPreKey(backend, identity.signing.privateKey, 1);
  const opks = generateOneTimePreKeys(backend, 1, ONE_TIME_PRE_KEY_BATCH_SIZE);

  await actions.uploadIdentityKey(
    toBase64(identity.dh.publicKey),
    toBase64(identity.signing.publicKey)
  );

  await actions.uploadSignedPreKey({
    keyId: spk.keyId,
    publicKey: toBase64(spk.keyPair.publicKey),
    signature: toBase64(spk.signature),
  });

  await actions.uploadOneTimePreKeys(
    opks.map((opk) => ({ keyId: opk.keyId, publicKey: toBase64(opk.keyPair.publicKey) }))
  );

  const backupData = {
    signingPrivateKey: toBase64(identity.signing.privateKey),
    signingPublicKey: toBase64(identity.signing.publicKey),
    dhPrivateKey: toBase64(identity.dh.privateKey),
    dhPublicKey: toBase64(identity.dh.publicKey),
  };
  const backup = await encryptIdentityBackup(backend, backupData, pin);
  await actions.uploadBackup({
    encryptedPrivateKey: backup.ciphertext,
    backupIv: backup.iv,
    salt: backup.salt,
  });

  const storedIdentity: StoredIdentity = {
    signingPublicKey: toBase64(identity.signing.publicKey),
    signingPrivateKey: toBase64(identity.signing.privateKey),
    dhPublicKey: toBase64(identity.dh.publicKey),
    dhPrivateKey: toBase64(identity.dh.privateKey),
  };
  await storeIdentity(userId, storedIdentity);

  await storeSignedPreKey(userId, {
    keyId: spk.keyId,
    privateKey: toBase64(spk.keyPair.privateKey),
    publicKey: toBase64(spk.keyPair.publicKey),
  });
  await storeOneTimePreKeys(
    userId,
    opks.map((opk) => ({ keyId: opk.keyId, privateKey: toBase64(opk.keyPair.privateKey) }))
  );
}

export async function recoverKeysWithPIN(
  userId: string,
  pin: string,
  backup: { encryptedPrivateKey: string; backupIv: string; salt: string },
  actions: {
    uploadIdentityKey: (identityPub: string, signingPub: string) => Promise<void>;
    uploadSignedPreKey: (data: {
      keyId: number;
      publicKey: string;
      signature: string;
    }) => Promise<void>;
    uploadOneTimePreKeys: (keys: { keyId: number; publicKey: string }[]) => Promise<void>;
  }
): Promise<void> {
  const backend = getBackend();

  const decrypted = await decryptIdentityBackup(
    backend,
    { ciphertext: backup.encryptedPrivateKey, iv: backup.backupIv, salt: backup.salt },
    pin
  );

  const storedIdentity: StoredIdentity = {
    signingPublicKey: decrypted.signingPublicKey,
    signingPrivateKey: decrypted.signingPrivateKey,
    dhPublicKey: decrypted.dhPublicKey,
    dhPrivateKey: decrypted.dhPrivateKey,
  };
  await storeIdentity(userId, storedIdentity);

  await actions.uploadIdentityKey(decrypted.dhPublicKey, decrypted.signingPublicKey);

  const signingPrivateKey = fromBase64(decrypted.signingPrivateKey);
  const spk = generateSignedPreKey(backend, signingPrivateKey, 1);
  const opks = generateOneTimePreKeys(backend, 1, ONE_TIME_PRE_KEY_BATCH_SIZE);

  await actions.uploadSignedPreKey({
    keyId: spk.keyId,
    publicKey: toBase64(spk.keyPair.publicKey),
    signature: toBase64(spk.signature),
  });
  await actions.uploadOneTimePreKeys(
    opks.map((opk) => ({ keyId: opk.keyId, publicKey: toBase64(opk.keyPair.publicKey) }))
  );

  await storeSignedPreKey(userId, {
    keyId: spk.keyId,
    privateKey: toBase64(spk.keyPair.privateKey),
    publicKey: toBase64(spk.keyPair.publicKey),
  });
  await storeOneTimePreKeys(
    userId,
    opks.map((opk) => ({ keyId: opk.keyId, privateKey: toBase64(opk.keyPair.privateKey) }))
  );
}

export async function resetKeys(
  userId: string,
  actions: {
    deleteBackup: () => Promise<void>;
  }
): Promise<void> {
  await clearAllCryptoData(userId);
  await actions.deleteBackup();
  // User will need to set up keys again via setupKeysWithPIN
}

export async function replenishOneTimePreKeys(
  userId: string,
  getCount: () => Promise<number>,
  upload: (keys: { keyId: number; publicKey: string }[]) => Promise<void>
): Promise<void> {
  const backend = getBackend();
  const count = await getCount();
  if (count >= ONE_TIME_PRE_KEY_REFILL_THRESHOLD) return;

  const startKeyId = Date.now();
  const opks = generateOneTimePreKeys(backend, startKeyId, ONE_TIME_PRE_KEY_BATCH_SIZE);

  await upload(
    opks.map((opk) => ({ keyId: opk.keyId, publicKey: toBase64(opk.keyPair.publicKey) }))
  );

  await storeOneTimePreKeys(
    userId,
    opks.map((opk) => ({ keyId: opk.keyId, privateKey: toBase64(opk.keyPair.privateKey) }))
  );
}

export async function getOrCreateSession(
  conversationId: string,
  otherUserId: string,
  myUserId: string,
  fetchBundle: (userId: string) => Promise<PreKeyBundle | null>
): Promise<RatchetState> {
  const existing = await getSession(conversationId, otherUserId);
  if (existing) return deserializeRatchetState(existing);

  const backend = getBackend();
  const myIdentity = await getStoredIdentity(myUserId);
  if (!myIdentity) throw new Error('Identity keys not found — setup required');

  const bundleData = await fetchBundle(otherUserId);
  if (!bundleData) throw new Error('Could not fetch pre-key bundle for recipient');

  const bundle: PreKeyBundle = {
    identityKey: fromBase64(bundleData.identityKey as unknown as string),
    signingKey: fromBase64(bundleData.signingKey as unknown as string),
    signedPreKeyPublic: fromBase64(bundleData.signedPreKeyPublic as unknown as string),
    signedPreKeyId: bundleData.signedPreKeyId,
    signedPreKeySignature: fromBase64(bundleData.signedPreKeySignature as unknown as string),
    oneTimePreKeyPublic: bundleData.oneTimePreKeyPublic
      ? fromBase64(bundleData.oneTimePreKeyPublic as unknown as string)
      : undefined,
    oneTimePreKeyId: bundleData.oneTimePreKeyId,
  };

  const myIdentityKeyPair = {
    signing: {
      publicKey: fromBase64(myIdentity.signingPublicKey),
      privateKey: fromBase64(myIdentity.signingPrivateKey),
    },
    dh: {
      publicKey: fromBase64(myIdentity.dhPublicKey),
      privateKey: fromBase64(myIdentity.dhPrivateKey),
    },
  };

  const x3dhResult = await x3dhInitiate(backend, myIdentityKeyPair, bundle);
  const state = await initializeSender(backend, x3dhResult.sharedSecret, bundle.signedPreKeyPublic);

  await saveSession(conversationId, otherUserId, serializeRatchetState(state));

  return state;
}
