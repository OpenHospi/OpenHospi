import {
  getKeyStatus,
  encryptForRecipient,
  decryptFromSender,
  encryptForSelf as encryptForSelfFn,
  decryptForSelf as decryptForSelfFn,
  getIdentityFingerprint,
} from '@openhospi/crypto';
import type { EncryptedMessage, KeyStatus, FingerprintResult } from '@openhospi/crypto';
import { useCallback, useEffect, useState } from 'react';

import { cryptoStore } from '@/lib/crypto/store';
import { api } from '@/lib/api-client';
import { fetchBackupApi, fetchPreKeyBundleApi } from '@/services/encryption';

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
  encryptForSelf: (plaintext: string) => Promise<{ ciphertext: string; iv: string }>;
  decryptForSelf: (ciphertext: string, iv: string) => Promise<string>;
  getFingerprint: (otherUserId: string) => Promise<FingerprintResult | null>;
};

export function useEncryption(userId: string): UseEncryptionResult {
  const [status, setStatus] = useState<'loading' | KeyStatus>('loading');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const keyStatus = await getKeyStatus(cryptoStore, userId, fetchBackupApi);
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
      return encryptForRecipient(
        cryptoStore,
        userId,
        conversationId,
        recipientUserId,
        plaintext,
        async (targetUserId) => {
          const bundle = await fetchPreKeyBundleApi(targetUserId);
          return bundle ?? null;
        }
      );
    },
    [userId]
  );

  const decryptMessage = useCallback(
    async (
      conversationId: string,
      senderUserId: string,
      encrypted: EncryptedMessage
    ): Promise<string> => {
      return decryptFromSender(cryptoStore, userId, conversationId, senderUserId, encrypted);
    },
    [userId]
  );

  const encryptForSelf = useCallback(
    async (plaintext: string): Promise<{ ciphertext: string; iv: string }> => {
      return encryptForSelfFn(cryptoStore, userId, plaintext);
    },
    [userId]
  );

  const decryptForSelf = useCallback(
    async (ciphertext: string, iv: string): Promise<string> => {
      return decryptForSelfFn(cryptoStore, userId, ciphertext, iv);
    },
    [userId]
  );

  const getFingerprint = useCallback(
    async (otherUserId: string): Promise<FingerprintResult | null> => {
      return getIdentityFingerprint(cryptoStore, userId, otherUserId, async (userIds) => {
        const keys = await api.post<
          { userId: string; identityPublicKey: string; signingPublicKey: string }[]
        >('/api/mobile/keys/identity/batch', { userIds });
        return keys.map((k) => ({ signingPublicKey: k.signingPublicKey }));
      });
    },
    [userId]
  );

  return { status, encryptMessage, decryptMessage, encryptForSelf, decryptForSelf, getFingerprint };
}
