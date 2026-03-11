import {
  getKeyStatus,
  encryptForRecipient,
  decryptFromSender,
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
          if (!bundle) return null;
          return bundle;
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

  return { status, encryptMessage, decryptMessage, getFingerprint };
}
