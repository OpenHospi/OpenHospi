import {
  ONE_TIME_PRE_KEY_BATCH_SIZE,
  ONE_TIME_PRE_KEY_REFILL_THRESHOLD,
} from "@openhospi/shared/constants";

import { getBackend } from "../backends/platform";
import { decryptIdentityBackup, encryptIdentityBackup } from "../protocol/backup";
import { fromBase64, toBase64 } from "../protocol/encoding";
import { decrypt, encrypt } from "../protocol/encryption";
import {
  generateIdentityKeyPair,
  generateOneTimePreKeys,
  generateSignedPreKey,
} from "../protocol/keys";
import {
  deserializeSenderKeyState,
  generateSenderKey,
  serializeSenderKeyState,
} from "../protocol/sender-key";
import type {
  IdentityKeyPair,
  PreKeyBundle,
  SenderKeyDistributionData,
  SenderKeyDistributionEnvelope,
  SenderKeyState,
  ServerPreKeyBundle,
} from "../protocol/types";
import { x3dhInitiate, x3dhRespond } from "../protocol/x3dh";
import type { CryptoStore, StoredIdentity } from "../store/types";

export type KeyStatus = "ready" | "needs-recovery" | "needs-setup";

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

// ── Sender Key Management ──

/**
 * Get own Sender Key for conversation, generate if not exists.
 * Returns isNew=true when a fresh key was generated (caller must distribute it).
 */
export async function getOrCreateOwnSenderKey(
  store: CryptoStore,
  conversationId: string,
  userId: string,
): Promise<{ state: SenderKeyState; isNew: boolean }> {
  const existing = await store.getSenderKey(conversationId, userId);
  if (existing) {
    return { state: deserializeSenderKeyState(existing), isNew: false };
  }

  const backend = getBackend();
  const state = generateSenderKey(backend);
  await store.saveSenderKey(conversationId, userId, serializeSenderKeyState(state));
  return { state, isNew: true };
}

/**
 * Distribute own Sender Key to group members via X3DH one-shot.
 *
 * For each member: X3DH initiate -> derive shared secret -> AES-GCM encrypt SenderKeyDistributionData
 */
export async function distributeSenderKey(
  store: CryptoStore,
  conversationId: string,
  userId: string,
  memberUserIds: string[],
  state: SenderKeyState,
  fetchBundle: (userId: string) => Promise<ServerPreKeyBundle | null>,
): Promise<Array<{ recipientUserId: string; envelope: SenderKeyDistributionEnvelope }>> {
  const backend = getBackend();
  const myIdentity = await store.getStoredIdentity(userId);
  if (!myIdentity) throw new Error("Identity keys not found — setup required");

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

  const distributionData: SenderKeyDistributionData = {
    chainKey: toBase64(state.chainKey),
    signingPublicKey: toBase64(state.signingKeyPair.publicKey),
    iteration: state.iteration,
  };
  const plaintext = new TextEncoder().encode(JSON.stringify(distributionData));

  const results: Array<{ recipientUserId: string; envelope: SenderKeyDistributionEnvelope }> = [];

  for (const recipientUserId of memberUserIds) {
    const bundleData = await fetchBundle(recipientUserId);
    if (!bundleData) {
      console.warn(`[distributeSenderKey] No pre-key bundle for ${recipientUserId}, skipping`);
      continue;
    }

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

    const x3dhResult = await x3dhInitiate(backend, myIdentityKeyPair, bundle);

    // Encrypt SenderKeyDistributionData with the X3DH shared secret
    const { ciphertext, iv } = await encrypt(backend, x3dhResult.sharedSecret, plaintext);

    results.push({
      recipientUserId,
      envelope: {
        encryptedKeyData: toBase64(ciphertext),
        iv: toBase64(iv),
        ephemeralPublicKey: toBase64(x3dhResult.ephemeralPublicKey),
        senderIdentityKey: toBase64(myIdentityKeyPair.dh.publicKey),
        usedSignedPreKeyId: x3dhResult.usedSignedPreKeyId,
        usedOneTimePreKeyId: x3dhResult.usedOneTimePreKeyId,
      },
    });
  }

  return results;
}

/**
 * Receive and process a Sender Key distribution from another user.
 *
 * X3DH respond -> derive shared secret -> decrypt SenderKeyDistributionData -> store Sender Key
 */
export async function receiveSenderKeyDistribution(
  store: CryptoStore,
  conversationId: string,
  senderUserId: string,
  userId: string,
  envelope: SenderKeyDistributionEnvelope,
): Promise<void> {
  const backend = getBackend();
  const myIdentity = await store.getStoredIdentity(userId);
  if (!myIdentity) throw new Error("Identity keys not found");

  const spks = await store.getStoredSignedPreKeys(userId);
  const spk = spks.find((k) => k.keyId === envelope.usedSignedPreKeyId);
  if (!spk) throw new Error("Signed pre-key not found for Sender Key distribution");

  let opkPrivate: Uint8Array | null = null;
  if (envelope.usedOneTimePreKeyId != null) {
    const opkPrivateB64 = await store.consumeOneTimePreKey(userId, envelope.usedOneTimePreKeyId);
    if (!opkPrivateB64) {
      throw new Error(
        `One-time pre-key ${envelope.usedOneTimePreKeyId} not found locally — cannot derive shared secret`,
      );
    }
    opkPrivate = fromBase64(opkPrivateB64);
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
    fromBase64(envelope.senderIdentityKey),
    fromBase64(envelope.ephemeralPublicKey),
  );

  // Decrypt the SenderKeyDistributionData
  const plaintext = await decrypt(
    backend,
    sharedSecret,
    fromBase64(envelope.encryptedKeyData),
    fromBase64(envelope.iv),
  );

  const data: SenderKeyDistributionData = JSON.parse(new TextDecoder().decode(plaintext));

  // Store the sender's Sender Key (without signing private key — we only need the public key)
  await store.saveSenderKey(conversationId, senderUserId, {
    chainKey: data.chainKey,
    signingPublicKey: data.signingPublicKey,
    iteration: data.iteration,
    skippedMessageKeys: [],
  });
}
