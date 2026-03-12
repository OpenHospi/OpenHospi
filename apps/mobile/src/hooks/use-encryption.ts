import {
  getKeyStatus,
  encryptForRecipient,
  decryptFromSender,
  encryptForSelf as encryptForSelfFn,
  decryptForSelf as decryptForSelfFn,
  getIdentityFingerprint,
} from '@openhospi/crypto';
import type {
  EncryptedMessage,
  EncryptResult,
  KeyStatus,
  FingerprintResult,
  X3DHMetadata,
} from '@openhospi/crypto';
import { useEffect, useState } from 'react';

import { cryptoStore } from '@/lib/crypto/store';
import { api } from '@/lib/api-client';
import { fetchBackupApi, fetchPreKeyBundleApi } from '@/services/encryption';

async function fetchBundle(targetUserId: string) {
  const bundle = await fetchPreKeyBundleApi(targetUserId);
  return bundle ?? null;
}

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

  async function encryptMessage(
    conversationId: string,
    recipientUserId: string,
    plaintext: string
  ): Promise<EncryptResult> {
    return encryptForRecipient(
      cryptoStore,
      userId,
      conversationId,
      recipientUserId,
      plaintext,
      fetchBundle
    );
  }

  async function decryptMessage(
    conversationId: string,
    senderUserId: string,
    encrypted: EncryptedMessage,
    x3dhMeta?: X3DHMetadata | null
  ): Promise<string> {
    return decryptFromSender(
      cryptoStore,
      userId,
      conversationId,
      senderUserId,
      encrypted,
      x3dhMeta
    );
  }

  async function encryptForSelf(plaintext: string): Promise<{ ciphertext: string; iv: string }> {
    return encryptForSelfFn(cryptoStore, userId, plaintext);
  }

  async function decryptForSelf(ciphertext: string, iv: string): Promise<string> {
    return decryptForSelfFn(cryptoStore, userId, ciphertext, iv);
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
    encryptMessage,
    decryptMessage,
    encryptForSelf,
    decryptForSelf,
    getFingerprint,
  };
}
