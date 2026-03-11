import {
  getBackend,
  ratchetEncrypt,
  ratchetDecrypt,
  serializeRatchetState,
  deserializeRatchetState,
  generateSafetyNumber,
  encodeSafetyNumberQR,
  fromBase64,
} from '@openhospi/crypto';
import type { EncryptedMessage } from '@openhospi/crypto';
import { useCallback, useEffect, useState } from 'react';

import { getKeyStatus, getOrCreateSession } from '@/lib/crypto/key-management';
import type { KeyStatus } from '@/lib/crypto/key-management';
import { getSession, getStoredIdentity, saveSession } from '@/lib/crypto/store';
import { api } from '@/lib/api-client';
import { fetchBackupApi, fetchPreKeyBundleApi } from '@/services/encryption';

export type FingerprintResult = {
  safetyNumber: string;
  qrPayload: string;
} | null;

type UseEncryptionResult = {
  status: 'loading' | KeyStatus;
  encryptMessage: (
    conversationId: string,
    recipientUserId: string,
    plaintext: string
  ) => Promise<EncryptedMessage>;
  decryptMessage: (
    conversationId: string,
    senderUserId: string,
    encrypted: EncryptedMessage
  ) => Promise<string>;
  getIdentityFingerprint: (otherUserId: string) => Promise<FingerprintResult>;
};

export function useEncryption(userId: string): UseEncryptionResult {
  const [status, setStatus] = useState<'loading' | KeyStatus>('loading');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const keyStatus = await getKeyStatus(userId, fetchBackupApi);
      if (!cancelled) setStatus(keyStatus);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const encryptMessage = useCallback(
    async (
      conversationId: string,
      recipientUserId: string,
      plaintext: string
    ): Promise<EncryptedMessage> => {
      const backend = getBackend();

      const state = await getOrCreateSession(
        conversationId,
        recipientUserId,
        userId,
        async (targetUserId) => {
          const bundle = await fetchPreKeyBundleApi(targetUserId);
          if (!bundle) return null;
          return {
            identityKey: fromBase64(bundle.identityPublicKey),
            signingKey: fromBase64(bundle.signingPublicKey),
            signedPreKeyPublic: fromBase64(bundle.signedPreKeyPublic),
            signedPreKeyId: bundle.signedPreKeyId,
            signedPreKeySignature: fromBase64(bundle.signedPreKeySignature),
            oneTimePreKeyPublic: bundle.oneTimePreKeyPublic
              ? fromBase64(bundle.oneTimePreKeyPublic)
              : undefined,
            oneTimePreKeyId: bundle.oneTimePreKeyId,
          };
        }
      );

      const { state: newState, encrypted } = await ratchetEncrypt(backend, state, plaintext);
      await saveSession(conversationId, recipientUserId, serializeRatchetState(newState));

      return encrypted;
    },
    [userId]
  );

  const decryptMessage = useCallback(
    async (
      conversationId: string,
      senderUserId: string,
      encrypted: EncryptedMessage
    ): Promise<string> => {
      const backend = getBackend();

      const serialized = await getSession(conversationId, senderUserId);
      if (!serialized) {
        throw new Error('No session found for this sender — message cannot be decrypted');
      }

      const state = deserializeRatchetState(serialized);
      const { state: newState, plaintext } = await ratchetDecrypt(backend, state, encrypted);
      await saveSession(conversationId, senderUserId, serializeRatchetState(newState));

      return plaintext;
    },
    []
  );

  const getIdentityFingerprint = useCallback(
    async (otherUserId: string): Promise<FingerprintResult> => {
      const myIdentity = await getStoredIdentity(userId);
      if (!myIdentity) return null;

      const keys = await api.post<
        { userId: string; identityPublicKey: string; signingPublicKey: string }[]
      >('/api/mobile/keys/identity/batch', { userIds: [otherUserId] });

      const theirKeys = keys[0];
      if (!theirKeys) return null;

      const safetyNumber = await generateSafetyNumber(
        userId,
        fromBase64(myIdentity.signingPublicKey),
        otherUserId,
        fromBase64(theirKeys.signingPublicKey)
      );

      const qrPayload = encodeSafetyNumberQR(
        userId,
        fromBase64(myIdentity.signingPublicKey),
        safetyNumber
      );

      return { safetyNumber, qrPayload };
    },
    [userId]
  );

  return { status, encryptMessage, decryptMessage, getIdentityFingerprint };
}
