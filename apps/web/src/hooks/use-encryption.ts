"use client";

import type { ProtocolAddress, SenderKeyMessageData } from "@openhospi/crypto";
import {
  DecryptionQueue,
  decryptGroupMessage,
  encryptGroupMessage as cryptoEncryptGroup,
  establishSession,
  fromBase64,
  generateSafetyNumber,
  initAndDistributeSenderKey,
  processDistribution,
  replenishPreKeysIfNeeded,
  rotateSignedPreKeyIfNeeded,
  setupDevice,
  shouldRotateSenderKey,
  toBase64,
} from "@openhospi/crypto";
import { useCallback, useState } from "react";

import {
  acknowledgeDist,
  fetchDevicesForUser,
  fetchPendingDists,
  fetchPreKeyBundleForDevice,
  registerUserDevice,
  uploadKeyBackup,
} from "@/app/[locale]/(app)/chat/key-actions";
import { cryptoStore } from "@/lib/crypto";

type EncryptionStatus = "uninitialized" | "initializing" | "ready" | "error";

export type EncryptResult = {
  payload: string;
  deviceId: string;
  distributions: Array<{
    recipientDeviceId: string;
    ciphertext: string;
  }>;
};

const decryptionQueue = new DecryptionQueue();

// Shared across all hook instances so EncryptionGate and ChatInput see the same value
let sharedDeviceUuid: string | null = null;
let sharedInitDone = false;
const sharedSenderKeyCreatedAt = new Map<string, number>();

export function useEncryption(userId: string | undefined) {
  const [status, setStatus] = useState<EncryptionStatus>("uninitialized");
  const [error, setError] = useState<Error | null>(null);

  /**
   * Initialize the device — generate keys, register with server.
   */
  const initializeDevice = useCallback(
    async (pin: string) => {
      if (!userId || sharedInitDone) return;
      sharedInitDone = true;
      setStatus("initializing");

      try {
        const result = await setupDevice(cryptoStore, pin);

        // Register device with server
        const device = await registerUserDevice({
          registrationId: result.registrationId,
          identityKeyPublic: result.identityKeyPublic,
          signingKeyPublic: result.signingKeyPublic,
          platform: "web",
          signedPreKey: result.signedPreKey,
          oneTimePreKeys: result.oneTimePreKeys,
        });

        // Upload encrypted backup
        await uploadKeyBackup({
          encryptedData: result.encryptedBackup.ciphertext,
          iv: result.encryptedBackup.iv,
          salt: result.encryptedBackup.salt,
        });

        sharedDeviceUuid = device.id;
        setStatus("ready");
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setStatus("error");
        sharedInitDone = false;
      }
    },
    [userId],
  );

  /**
   * Check if local keys exist and set status accordingly.
   */
  const checkStatus = useCallback(async () => {
    try {
      const hasKeys = await cryptoStore.hasIdentityKey();
      if (hasKeys) {
        // Load device UUID from server if not already set
        if (!sharedDeviceUuid && userId) {
          const myDevices = await fetchDevicesForUser(userId);
          const webDevice = myDevices.find((d) => d.platform === "web");
          if (webDevice) {
            sharedDeviceUuid = webDevice.id;
          }
        }

        setStatus("ready");

        // Run key maintenance in the background
        if (sharedDeviceUuid) {
          const deviceId = sharedDeviceUuid;
          replenishPreKeysIfNeeded(cryptoStore, deviceId, {
            getPreKeyCount: async () => {
              const { getOneTimePreKeyCount } = await import("@/lib/services/key-mutations");
              return getOneTimePreKeyCount(deviceId);
            },
            uploadPreKeys: async (id, keys) => {
              const { replenishPreKeys } = await import("@/app/[locale]/(app)/chat/key-actions");
              await replenishPreKeys(id, keys);
            },
            uploadSignedPreKey: async (id, data) => {
              const { rotateDeviceSignedPreKey } =
                await import("@/app/[locale]/(app)/chat/key-actions");
              await rotateDeviceSignedPreKey(id, data);
            },
            getLatestSignedPreKeyTimestamp: async () => null,
          }).catch(() => {});

          rotateSignedPreKeyIfNeeded(cryptoStore, deviceId, {
            getPreKeyCount: async () => 0,
            uploadPreKeys: async () => {},
            uploadSignedPreKey: async (id, data) => {
              const { rotateDeviceSignedPreKey } =
                await import("@/app/[locale]/(app)/chat/key-actions");
              await rotateDeviceSignedPreKey(id, data);
            },
            getLatestSignedPreKeyTimestamp: async () => null,
          }).catch(() => {});
        }
      }
    } catch {
      // No keys yet
    }
  }, [userId]);

  /**
   * Ensure 1:1 sessions exist with all member devices.
   */
  const ensureSessions = useCallback(
    async (memberUserIds: string[]) => {
      if (!userId) return;

      for (const memberId of memberUserIds) {
        if (memberId === userId) continue;

        const memberDevices = await fetchDevicesForUser(memberId);

        for (const device of memberDevices) {
          const address: ProtocolAddress = { userId: memberId, deviceId: device.id };
          const existingSession = await cryptoStore.loadSession(address);

          if (!existingSession) {
            const bundle = await fetchPreKeyBundleForDevice(device.id);
            if (!bundle) continue;

            await establishSession(cryptoStore, address, {
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
    [userId],
  );

  /**
   * Generate and distribute a sender key for a conversation.
   * Returns the encrypted distributions for each member device.
   */
  const distributeSenderKey = useCallback(
    async (
      conversationId: string,
      memberUserIds: string[],
    ): Promise<Array<{ recipientDeviceId: string; ciphertext: string }>> => {
      if (!userId || !sharedDeviceUuid) return [];

      // Ensure sessions exist before distributing
      await ensureSessions(memberUserIds);

      // Collect all member device addresses, excluding our own device
      const memberAddresses: ProtocolAddress[] = [];
      for (const memberId of memberUserIds) {
        const memberDevices = await fetchDevicesForUser(memberId);
        for (const d of memberDevices) {
          if (memberId === userId && d.id === sharedDeviceUuid) continue;
          memberAddresses.push({ userId: memberId, deviceId: d.id });
        }
      }

      const localAddress: ProtocolAddress = { userId, deviceId: sharedDeviceUuid };

      const { distributions } = await initAndDistributeSenderKey(
        cryptoStore,
        localAddress,
        conversationId,
        memberAddresses,
      );

      // Return distributions as base64 for the caller to bundle atomically
      return distributions.map((dist) => ({
        recipientDeviceId: dist.recipientAddress.deviceId,
        ciphertext: toBase64(dist.encryptedDistribution),
      }));
    },
    [userId, ensureSessions],
  );

  /**
   * Encrypt a message for a group conversation.
   * Returns the payload, device ID, and distributions for atomic sending.
   */
  const encryptMessage = useCallback(
    async (
      conversationId: string,
      memberUserIds: string[],
      plaintext: string,
    ): Promise<EncryptResult> => {
      if (!userId) throw new Error("Not authenticated");
      if (!sharedDeviceUuid) throw new Error("Device not initialized");

      // Step 1: Ensure 1:1 sessions with all members
      await ensureSessions(memberUserIds);

      const localAddress: ProtocolAddress = { userId, deviceId: sharedDeviceUuid };

      // Step 2: Check if we have a sender key, rotate if needed, distribute if missing
      const existingKey = await cryptoStore.loadSenderKey(localAddress, conversationId);
      const createdAt = sharedSenderKeyCreatedAt.get(conversationId) ?? 0;
      const needsRotation = existingKey && shouldRotateSenderKey(existingKey, createdAt);

      let distributions: Array<{ recipientDeviceId: string; ciphertext: string }> = [];

      if (!existingKey || needsRotation) {
        distributions = await distributeSenderKey(conversationId, memberUserIds);
        sharedSenderKeyCreatedAt.set(conversationId, Date.now());
      }

      // Step 3: Encrypt with sender key (O(1))
      const { encodeUtf8 } = await import("@openhospi/crypto");
      const message = await cryptoEncryptGroup(
        cryptoStore,
        localAddress,
        conversationId,
        encodeUtf8(plaintext),
      );

      // Return serialised payload + deviceId + distributions
      const payload = JSON.stringify({
        distributionId: message.distributionId,
        chainId: message.chainId,
        ciphertext: toBase64(message.ciphertext),
        signature: toBase64(message.signature),
      });

      return {
        payload,
        deviceId: sharedDeviceUuid,
        distributions,
      };
    },
    [userId, ensureSessions, distributeSenderKey],
  );

  /**
   * Process a received sender key distribution message.
   */
  const processIncomingDistribution = useCallback(
    async (senderAddress: ProtocolAddress, distributionBytes: Uint8Array) => {
      await processDistribution(cryptoStore, senderAddress, distributionBytes);

      // Retry any queued messages from this sender
      const queued = decryptionQueue.getForSender("", senderAddress);
      for (const msg of queued) {
        try {
          await decryptGroupMessage(
            cryptoStore,
            msg.senderAddress,
            msg.conversationId,
            msg.payload,
          );
          decryptionQueue.dequeue(msg.id);
        } catch {
          // Still can't decrypt — leave in queue
        }
      }

      decryptionQueue.cleanup();
    },
    [],
  );

  /**
   * Decrypt a group message from a sender.
   */
  const decryptMessage = useCallback(
    async (
      messageId: string,
      conversationId: string,
      senderAddress: ProtocolAddress,
      payloadStr: string,
    ): Promise<string> => {
      const payload = JSON.parse(payloadStr);
      const { decodeUtf8 } = await import("@openhospi/crypto");

      const message: SenderKeyMessageData = {
        distributionId: payload.distributionId,
        chainId: payload.chainId,
        ciphertext: fromBase64(payload.ciphertext),
        signature: fromBase64(payload.signature),
      };

      try {
        const plaintext = await decryptGroupMessage(
          cryptoStore,
          senderAddress,
          conversationId,
          message,
        );
        decryptionQueue.dequeue(messageId);
        return decodeUtf8(plaintext);
      } catch (err) {
        decryptionQueue.enqueue(messageId, conversationId, senderAddress, message);
        throw err;
      }
    },
    [],
  );

  /**
   * Generate a safety number for verifying identity with a remote user.
   */
  const getSafetyNumber = useCallback(
    async (remoteUserId: string): Promise<string> => {
      if (!userId) throw new Error("Not authenticated");

      const localSigningKey = await cryptoStore.getSigningKeyPair();

      const remoteDevices = await fetchDevicesForUser(remoteUserId);
      if (remoteDevices.length === 0) throw new Error("Remote user has no devices");

      const remoteSigningKey = fromBase64(remoteDevices[0].signingKeyPublic);

      return generateSafetyNumber(
        userId,
        localSigningKey.publicKey,
        remoteUserId,
        remoteSigningKey,
      );
    },
    [userId],
  );

  /**
   * Process any pending sender key distributions for our device.
   */
  const processPendingDistributions = useCallback(
    async (recipientDeviceId: string) => {
      if (!userId) return;

      const pending = await fetchPendingDists(recipientDeviceId);

      for (const dist of pending) {
        try {
          const { decrypt1to1 } = await import("@openhospi/crypto");
          const senderAddress: ProtocolAddress = {
            userId: dist.senderUserId,
            deviceId: dist.senderDeviceId,
          };

          const distributionBytes = await decrypt1to1(
            cryptoStore,
            senderAddress,
            fromBase64(dist.ciphertext),
          );

          await processDistribution(cryptoStore, senderAddress, distributionBytes);
          await acknowledgeDist(dist.id);
        } catch (err) {
          console.error("[useEncryption] Failed to process distribution:", err);
        }
      }
    },
    [userId],
  );

  return {
    status,
    error,
    deviceId: sharedDeviceUuid,
    initializeDevice,
    checkStatus,
    ensureSessions,
    distributeSenderKey,
    encryptMessage,
    processIncomingDistribution,
    decryptMessage,
    getSafetyNumber,
    processPendingDistributions,
  };
}
