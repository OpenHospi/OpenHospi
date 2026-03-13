/**
 * React hook for E2EE operations on mobile.
 * Provides group message encrypt/decrypt and safety number verification.
 */
import { setCryptoProvider, generateSafetyNumber, getKeyStatus } from '@openhospi/crypto';
import { createNativeCryptoProvider } from '@openhospi/crypto/native';
import type { GroupCiphertextPayload, ProtocolAddress, KeyStatus } from '@openhospi/crypto';
import { useEffect, useState } from 'react';

import { getMobileSignalStore } from '@/lib/crypto/stores';
import {
  encryptMessage,
  deserializePayload,
  serializePayload,
} from '@/lib/encryption/MessageEncryptor';
import type { EncryptionDependencies } from '@/lib/encryption/MessageEncryptor';
import { decryptMessage } from '@/lib/encryption/MessageDecryptor';

let providerInitialized = false;

function ensureCryptoProvider() {
  if (!providerInitialized) {
    setCryptoProvider(createNativeCryptoProvider());
    providerInitialized = true;
  }
}

export function useEncryption(userId: string, deviceId: number) {
  const [status, setStatus] = useState<KeyStatus | null>(null);

  useEffect(() => {
    let cancelled = false;
    ensureCryptoProvider();

    (async () => {
      const store = getMobileSignalStore();
      const keyStatus = await getKeyStatus(store);
      if (!cancelled) setStatus(keyStatus);
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  async function encrypt(
    conversationId: string,
    memberUserIds: string[],
    plaintext: string,
    deps: EncryptionDependencies
  ): Promise<{ serialized: string; senderKeyId: number }> {
    const { payload, senderKeyId } = await encryptMessage(
      userId,
      deviceId,
      conversationId,
      memberUserIds,
      plaintext,
      deps
    );
    return { serialized: serializePayload(payload), senderKeyId };
  }

  async function decrypt(
    senderUserId: string,
    senderDeviceId: number,
    conversationId: string,
    serializedPayload: string
  ): Promise<string> {
    const payload = deserializePayload(serializedPayload);
    return decryptMessage(senderUserId, senderDeviceId, conversationId, payload);
  }

  async function getSafetyNumber(
    remoteUserId: string,
    remoteSigningPublicKey: Uint8Array
  ): Promise<string> {
    ensureCryptoProvider();
    const store = getMobileSignalStore();
    const identity = await store.getIdentityKeyPair();
    return generateSafetyNumber(
      userId,
      identity.signingKeyPair.publicKey,
      remoteUserId,
      remoteSigningPublicKey
    );
  }

  return {
    status,
    encrypt,
    decrypt,
    getSafetyNumber,
  };
}

export type { KeyStatus, GroupCiphertextPayload, EncryptionDependencies, ProtocolAddress };
