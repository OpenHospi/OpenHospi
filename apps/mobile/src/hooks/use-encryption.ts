import {
  getKeyStatus,
  encryptGroupMessage as encryptGroupMessageFn,
  decryptGroupMessage as decryptGroupMessageFn,
  getIdentityFingerprint,
} from '@openhospi/crypto';
import type { GroupCiphertextPayload, KeyStatus, FingerprintResult } from '@openhospi/crypto';
import { useEffect, useState } from 'react';

import { cryptoStore } from '@/lib/crypto/store';
import { api } from '@/lib/api-client';
import {
  fetchBackupApi,
  fetchPreKeyBundleApi,
  fetchSenderKeyDistributionApi,
  storeSenderKeyDistributionsApi,
  getExistingDistributionRecipientsApi,
} from '@/services/encryption';

export function useEncryption(userId: string) {
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

  async function encryptGroupMessage(
    conversationId: string,
    memberUserIds: string[],
    plaintext: string
  ): Promise<GroupCiphertextPayload> {
    return encryptGroupMessageFn(
      cryptoStore,
      userId,
      conversationId,
      memberUserIds,
      plaintext,
      async (targetUserId) => {
        const bundle = await fetchPreKeyBundleApi(targetUserId);
        return bundle ?? null;
      },
      async (distributions) => {
        await storeSenderKeyDistributionsApi(conversationId, distributions);
      },
      getExistingDistributionRecipientsApi
    );
  }

  async function decryptGroupMessage(
    conversationId: string,
    senderUserId: string,
    payload: GroupCiphertextPayload
  ): Promise<string> {
    return decryptGroupMessageFn(
      cryptoStore,
      userId,
      conversationId,
      senderUserId,
      payload,
      fetchSenderKeyDistributionApi
    );
  }

  async function getFingerprint(otherUserId: string): Promise<FingerprintResult | null> {
    return getIdentityFingerprint(cryptoStore, userId, otherUserId, async (userIds) => {
      const keys = await api.post<
        { userId: string; identityPublicKey: string; signingPublicKey: string }[]
      >('/api/mobile/keys/identity/batch', { userIds });
      return keys.map((k) => ({ signingPublicKey: k.signingPublicKey }));
    });
  }

  return {
    status,
    encryptGroupMessage,
    decryptGroupMessage,
    getFingerprint,
  };
}
