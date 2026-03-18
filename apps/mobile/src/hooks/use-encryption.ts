import type { ProtocolAddress, SenderKeyMessageData } from '@openhospi/crypto';
import {
  decryptGroupMessage,
  encryptGroupMessage as cryptoEncryptGroup,
  encodeUtf8,
  decodeUtf8,
  establishSession,
  fromBase64,
  initAndDistributeSenderKey,
  processDistribution,
  setupDevice,
  shouldRotateSenderKey,
  toBase64,
} from '@openhospi/crypto';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { api } from '@/lib/api-client';
import { getMobileSignalStore } from '@/lib/crypto/stores';

type EncryptionStatus = 'uninitialized' | 'initializing' | 'ready' | 'error';

type DeviceInfo = {
  id: string;
  registrationId: number;
  identityKeyPublic: string;
  signingKeyPublic: string;
  platform: string;
};

type PreKeyBundleResponse = {
  deviceId: string;
  userId: string;
  registrationId: number;
  identityKeyPublic: string;
  signingKeyPublic: string;
  signedPreKeyId: number;
  signedPreKeyPublic: string;
  signedPreKeySignature: string;
  oneTimePreKeyId?: number;
  oneTimePreKeyPublic?: string;
} | null;

type PendingDistribution = {
  id: string;
  conversationId: string;
  senderUserId: string;
  senderDeviceId: string;
  recipientDeviceId: string;
  ciphertext: string;
  status: string;
};

export type EncryptResult = {
  payload: string;
  deviceId: string;
  distributions: Array<{
    recipientDeviceId: string;
    ciphertext: string;
  }>;
};

const senderKeyCreatedAt = new Map<string, number>();

export function useEncryption(userId: string | undefined) {
  const [status, setStatus] = useState<EncryptionStatus>('uninitialized');
  const [error, setError] = useState<Error | null>(null);
  const deviceUuidRef = useRef<string | null>(null);

  const store = getMobileSignalStore();

  const initDevice = useCallback(async () => {
    if (!userId || deviceUuidRef.current) return;

    try {
      setStatus('initializing');
      const platform = Platform.OS === 'ios' ? 'ios' : 'android';
      const myDevices = await api.get<DeviceInfo[]>(`/api/mobile/chat/devices?userId=${userId}`);
      const myDevice = myDevices.find((d) => d.platform === platform);

      if (myDevice) {
        deviceUuidRef.current = myDevice.id;
        setStatus('ready');
      } else {
        setStatus('uninitialized');
      }
    } catch {
      setStatus('error');
    }
  }, [userId]);

  useEffect(() => {
    initDevice();
  }, [initDevice]);

  const initializeDevice = useCallback(
    async (pin: string) => {
      if (!userId) return;
      setStatus('initializing');

      try {
        const result = await setupDevice(store, pin);
        const platform = Platform.OS === 'ios' ? 'ios' : 'android';

        const device = await api.post<{ id: string }>('/api/mobile/chat/register-device', {
          registrationId: result.registrationId,
          identityKeyPublic: result.identityKeyPublic,
          signingKeyPublic: result.signingKeyPublic,
          platform,
          signedPreKey: result.signedPreKey,
          oneTimePreKeys: result.oneTimePreKeys,
        });

        await api.post('/api/mobile/chat/backup', {
          encryptedData: result.encryptedBackup.ciphertext,
          iv: result.encryptedBackup.iv,
          salt: result.encryptedBackup.salt,
        });

        deviceUuidRef.current = device.id;
        setStatus('ready');
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setStatus('error');
      }
    },
    [userId, store]
  );

  const checkStatus = useCallback(async () => {
    try {
      await store.getIdentityKeyPair();
      setStatus('ready');
    } catch {
      setStatus('uninitialized');
    }
  }, [store]);

  const ensureSessions = useCallback(
    async (memberUserIds: string[]) => {
      if (!userId) return;

      for (const memberId of memberUserIds) {
        if (memberId === userId) continue;

        const devices = await api.get<DeviceInfo[]>(`/api/mobile/chat/devices?userId=${memberId}`);

        for (const device of devices) {
          const address: ProtocolAddress = { userId: memberId, deviceId: device.id };
          const existing = await store.loadSession(address);

          if (!existing) {
            const bundle = await api.get<PreKeyBundleResponse>(
              `/api/mobile/chat/bundle/${device.id}`
            );
            if (!bundle) continue;

            await establishSession(store, address, {
              registrationId: bundle.registrationId,
              deviceId: bundle.deviceId,
              identityKey: fromBase64(bundle.identityKeyPublic),
              signingKey: fromBase64(bundle.signingKeyPublic),
              signedPreKeyId: bundle.signedPreKeyId,
              signedPreKey: fromBase64(bundle.signedPreKeyPublic),
              signedPreKeySignature: fromBase64(bundle.signedPreKeySignature),
              oneTimePreKeyId: bundle.oneTimePreKeyId,
              oneTimePreKey: bundle.oneTimePreKeyPublic
                ? fromBase64(bundle.oneTimePreKeyPublic)
                : undefined,
            });
          }
        }
      }
    },
    [userId, store]
  );

  const distributeSenderKey = useCallback(
    async (
      conversationId: string,
      memberUserIds: string[]
    ): Promise<Array<{ recipientDeviceId: string; ciphertext: string }>> => {
      if (!userId || !deviceUuidRef.current) return [];

      await ensureSessions(memberUserIds);

      const memberAddresses: ProtocolAddress[] = [];
      for (const memberId of memberUserIds) {
        const devices = await api.get<DeviceInfo[]>(`/api/mobile/chat/devices?userId=${memberId}`);
        for (const d of devices) {
          if (memberId === userId && d.id === deviceUuidRef.current) continue;
          memberAddresses.push({ userId: memberId, deviceId: d.id });
        }
      }

      const localAddress: ProtocolAddress = { userId, deviceId: deviceUuidRef.current };

      const { distributions } = await initAndDistributeSenderKey(
        store,
        localAddress,
        conversationId,
        memberAddresses
      );

      return distributions.map((dist) => ({
        recipientDeviceId: dist.recipientAddress.deviceId,
        ciphertext: toBase64(dist.encryptedDistribution),
      }));
    },
    [userId, store, ensureSessions]
  );

  const encryptMessage = useCallback(
    async (
      conversationId: string,
      memberUserIds: string[],
      plaintext: string
    ): Promise<EncryptResult> => {
      if (!userId) throw new Error('Not authenticated');
      if (!deviceUuidRef.current) throw new Error('Device not initialized');

      await ensureSessions(memberUserIds);

      const localAddress: ProtocolAddress = { userId, deviceId: deviceUuidRef.current };

      const existingKey = await store.loadSenderKey(localAddress, conversationId);
      const createdAt = senderKeyCreatedAt.get(conversationId) ?? 0;
      const needsRotation = existingKey && shouldRotateSenderKey(existingKey, createdAt);

      let distributions: Array<{ recipientDeviceId: string; ciphertext: string }> = [];

      if (!existingKey || needsRotation) {
        distributions = await distributeSenderKey(conversationId, memberUserIds);
        senderKeyCreatedAt.set(conversationId, Date.now());
      }

      const message = await cryptoEncryptGroup(
        store,
        localAddress,
        conversationId,
        encodeUtf8(plaintext)
      );

      const payload = JSON.stringify({
        distributionId: message.distributionId,
        chainId: message.chainId,
        ciphertext: toBase64(message.ciphertext),
        signature: toBase64(message.signature),
      });

      return {
        payload,
        deviceId: deviceUuidRef.current,
        distributions,
      };
    },
    [userId, store, ensureSessions, distributeSenderKey]
  );

  const decryptMessage = useCallback(
    async (
      conversationId: string,
      senderAddress: ProtocolAddress,
      payloadStr: string
    ): Promise<string> => {
      const payload = JSON.parse(payloadStr);

      const message: SenderKeyMessageData = {
        distributionId: payload.distributionId,
        chainId: payload.chainId,
        ciphertext: fromBase64(payload.ciphertext),
        signature: fromBase64(payload.signature),
      };

      const plaintext = await decryptGroupMessage(store, senderAddress, conversationId, message);
      return decodeUtf8(plaintext);
    },
    [store]
  );

  const processPendingDistributions = useCallback(
    async (recipientDeviceId: string) => {
      if (!userId) return;

      const pending = await api.get<PendingDistribution[]>(
        `/api/mobile/chat/distributions?recipientDeviceId=${recipientDeviceId}`
      );

      for (const dist of pending) {
        try {
          const { decrypt1to1 } = await import('@openhospi/crypto');
          const senderAddress: ProtocolAddress = {
            userId: dist.senderUserId,
            deviceId: dist.senderDeviceId,
          };

          const distributionBytes = await decrypt1to1(
            store,
            senderAddress,
            fromBase64(dist.ciphertext)
          );

          await processDistribution(store, senderAddress, distributionBytes);
          await api.post(`/api/mobile/chat/distributions/${dist.id}/ack`);
        } catch (err) {
          console.error('[useEncryption] Failed to process distribution:', err);
        }
      }
    },
    [userId, store]
  );

  return {
    status,
    error,
    deviceId: deviceUuidRef.current,
    initializeDevice,
    checkStatus,
    ensureSessions,
    distributeSenderKey,
    encryptMessage,
    decryptMessage,
    processPendingDistributions,
  };
}
