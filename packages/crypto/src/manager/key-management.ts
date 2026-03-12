import {
  ONE_TIME_PRE_KEY_BATCH_SIZE,
  ONE_TIME_PRE_KEY_REFILL_THRESHOLD,
} from "@openhospi/shared/constants";

import { getBackend } from "../backends/platform";
import { decryptIdentityBackup, encryptIdentityBackup } from "../protocol/backup";
import {
  deserializeRatchetState,
  initializeReceiver,
  initializeSender,
  serializeRatchetState,
} from "../protocol/double-ratchet";
import { fromBase64, toBase64 } from "../protocol/encoding";
import {
  generateIdentityKeyPair,
  generateOneTimePreKeys,
  generateSignedPreKey,
} from "../protocol/keys";
import type {
  IdentityKeyPair,
  PreKeyBundle,
  RatchetState,
  ServerPreKeyBundle,
} from "../protocol/types";
import { x3dhInitiate, x3dhRespond } from "../protocol/x3dh";
import type { CryptoStore, StoredIdentity } from "../store/types";

export type KeyStatus = "ready" | "needs-recovery" | "needs-setup";

export type X3DHSessionMeta = {
  ephemeralPublicKey: string; // base64
  senderIdentityKey: string; // base64
  usedSignedPreKeyId: number;
  usedOneTimePreKeyId?: number;
};

export async function getKeyStatus(
  store: CryptoStore,
  userId: string,
  fetchBackup: () => Promise<{ salt: string } | null>,
): Promise<KeyStatus> {
  const stored = await store.getStoredIdentity(userId);
  if (stored) return "ready";

  const backup = await fetchBackup();
  if (backup) return "needs-recovery";

  return "needs-setup";
}

export async function setupKeysWithPIN(
  store: CryptoStore,
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
  },
): Promise<void> {
  const backend = getBackend();

  const identity = generateIdentityKeyPair(backend);
  const spk = generateSignedPreKey(backend, identity.signing.privateKey, 1);
  const opks = generateOneTimePreKeys(backend, 1, ONE_TIME_PRE_KEY_BATCH_SIZE);

  await actions.uploadIdentityKey(
    toBase64(identity.dh.publicKey),
    toBase64(identity.signing.publicKey),
  );

  await actions.uploadSignedPreKey({
    keyId: spk.keyId,
    publicKey: toBase64(spk.keyPair.publicKey),
    signature: toBase64(spk.signature),
  });

  await actions.uploadOneTimePreKeys(
    opks.map((opk) => ({ keyId: opk.keyId, publicKey: toBase64(opk.keyPair.publicKey) })),
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
  await store.storeIdentity(userId, storedIdentity);

  await store.storeSignedPreKey(userId, {
    keyId: spk.keyId,
    privateKey: toBase64(spk.keyPair.privateKey),
    publicKey: toBase64(spk.keyPair.publicKey),
  });
  await store.storeOneTimePreKeys(
    userId,
    opks.map((opk) => ({ keyId: opk.keyId, privateKey: toBase64(opk.keyPair.privateKey) })),
  );
}

export async function recoverKeysWithPIN(
  store: CryptoStore,
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
  },
): Promise<void> {
  const backend = getBackend();

  const decrypted = await decryptIdentityBackup(
    backend,
    { ciphertext: backup.encryptedPrivateKey, iv: backup.backupIv, salt: backup.salt },
    pin,
  );

  const storedIdentity: StoredIdentity = {
    signingPublicKey: decrypted.signingPublicKey,
    signingPrivateKey: decrypted.signingPrivateKey,
    dhPublicKey: decrypted.dhPublicKey,
    dhPrivateKey: decrypted.dhPrivateKey,
  };
  await store.storeIdentity(userId, storedIdentity);

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
    opks.map((opk) => ({ keyId: opk.keyId, publicKey: toBase64(opk.keyPair.publicKey) })),
  );

  await store.storeSignedPreKey(userId, {
    keyId: spk.keyId,
    privateKey: toBase64(spk.keyPair.privateKey),
    publicKey: toBase64(spk.keyPair.publicKey),
  });
  await store.storeOneTimePreKeys(
    userId,
    opks.map((opk) => ({ keyId: opk.keyId, privateKey: toBase64(opk.keyPair.privateKey) })),
  );
}

export async function resetKeys(
  store: CryptoStore,
  userId: string,
  actions: {
    deleteBackup: () => Promise<void>;
  },
): Promise<void> {
  await store.clearAllCryptoData(userId);
  await actions.deleteBackup();
}

export async function replenishOneTimePreKeys(
  store: CryptoStore,
  userId: string,
  getCount: () => Promise<number>,
  upload: (keys: { keyId: number; publicKey: string }[]) => Promise<void>,
): Promise<void> {
  const backend = getBackend();
  const count = await getCount();
  if (count >= ONE_TIME_PRE_KEY_REFILL_THRESHOLD) return;

  const startKeyId = Date.now();
  const opks = generateOneTimePreKeys(backend, startKeyId, ONE_TIME_PRE_KEY_BATCH_SIZE);

  await upload(
    opks.map((opk) => ({ keyId: opk.keyId, publicKey: toBase64(opk.keyPair.publicKey) })),
  );

  await store.storeOneTimePreKeys(
    userId,
    opks.map((opk) => ({ keyId: opk.keyId, privateKey: toBase64(opk.keyPair.privateKey) })),
  );
}

/**
 * Get or create a Double Ratchet session as INITIATOR (sender of first message).
 * Returns the ratchet state and X3DH metadata (only when a new session was created).
 */
export async function getOrCreateSession(
  store: CryptoStore,
  conversationId: string,
  otherUserId: string,
  myUserId: string,
  fetchBundle: (userId: string) => Promise<ServerPreKeyBundle | null>,
): Promise<{ state: RatchetState; x3dhMeta?: X3DHSessionMeta }> {
  const existing = await store.getSession(conversationId, otherUserId);
  if (existing) return { state: deserializeRatchetState(existing) };

  const backend = getBackend();
  const myIdentity = await store.getStoredIdentity(myUserId);
  if (!myIdentity) throw new Error("Identity keys not found — setup required");

  const bundleData = await fetchBundle(otherUserId);
  if (!bundleData) throw new Error("Could not fetch pre-key bundle for recipient");

  const bundle: PreKeyBundle = {
    identityKey: fromBase64(bundleData.identityPublicKey),
    signingKey: fromBase64(bundleData.signingPublicKey),
    signedPreKeyPublic: fromBase64(bundleData.signedPreKeyPublic),
    signedPreKeyId: bundleData.signedPreKeyId,
    signedPreKeySignature: fromBase64(bundleData.signedPreKeySignature),
    oneTimePreKeyPublic: bundleData.oneTimePreKeyPublic
      ? fromBase64(bundleData.oneTimePreKeyPublic)
      : undefined,
    oneTimePreKeyId: bundleData.oneTimePreKeyId,
  };

  const myIdentityKeyPair: IdentityKeyPair = {
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

  await store.saveSession(conversationId, otherUserId, serializeRatchetState(state));

  return {
    state,
    x3dhMeta: {
      ephemeralPublicKey: toBase64(x3dhResult.ephemeralPublicKey),
      senderIdentityKey: toBase64(myIdentityKeyPair.dh.publicKey),
      usedSignedPreKeyId: x3dhResult.usedSignedPreKeyId,
      usedOneTimePreKeyId: x3dhResult.usedOneTimePreKeyId,
    },
  };
}

/**
 * Create a Double Ratchet session as RESPONDER (receiver of first message).
 * Uses X3DH metadata from the incoming PreKey message to derive the shared secret.
 */
export async function createSessionAsResponder(
  store: CryptoStore,
  conversationId: string,
  senderUserId: string,
  myUserId: string,
  x3dhMeta: {
    ephemeralPublicKey: string;
    senderIdentityKey: string;
    usedSignedPreKeyId: number;
    usedOneTimePreKeyId?: number;
  },
): Promise<RatchetState> {
  const backend = getBackend();
  const myIdentity = await store.getStoredIdentity(myUserId);
  if (!myIdentity) throw new Error("Identity keys not found");

  const spks = await store.getStoredSignedPreKeys(myUserId);
  const spk = spks.find((k) => k.keyId === x3dhMeta.usedSignedPreKeyId);
  if (!spk) throw new Error("Signed pre-key not found");

  let opkPrivate: Uint8Array | null = null;
  if (x3dhMeta.usedOneTimePreKeyId != null) {
    const opkPrivateB64 = await store.consumeOneTimePreKey(myUserId, x3dhMeta.usedOneTimePreKeyId);
    if (opkPrivateB64) opkPrivate = fromBase64(opkPrivateB64);
  }

  const myIdentityKeyPair: IdentityKeyPair = {
    signing: {
      publicKey: fromBase64(myIdentity.signingPublicKey),
      privateKey: fromBase64(myIdentity.signingPrivateKey),
    },
    dh: {
      publicKey: fromBase64(myIdentity.dhPublicKey),
      privateKey: fromBase64(myIdentity.dhPrivateKey),
    },
  };

  const sharedSecret = await x3dhRespond(
    backend,
    myIdentityKeyPair,
    fromBase64(spk.privateKey),
    opkPrivate,
    fromBase64(x3dhMeta.senderIdentityKey),
    fromBase64(x3dhMeta.ephemeralPublicKey),
  );

  const state = initializeReceiver(sharedSecret, {
    publicKey: fromBase64(spk.publicKey),
    privateKey: fromBase64(spk.privateKey),
  });

  await store.saveSession(conversationId, senderUserId, serializeRatchetState(state));
  return state;
}
