"use client";

import type { ProtocolAddress } from "@openhospi/crypto";
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
import { useCallback, useEffect, useRef, useState } from "react";

import {
  acknowledgeDist,
  fetchDevicesForUser,
  fetchPendingDists,
  fetchPreKeyBundleForDevice,
  registerUserDevice,
  storeSenderKeyDist,
  uploadKeyBackup,
} from "@/app/[locale]/(app)/chat/key-actions";
import { cryptoStore, sentMessageCache } from "@/lib/crypto";

type EncryptionStatus = "uninitialized" | "initializing" | "ready" | "error";

const decryptionQueue = new DecryptionQueue();

export function useEncryption(userId: string | undefined) {
  const [status, setStatus] = useState<EncryptionStatus>("uninitialized");
  const [error, setError] = useState<Error | null>(null);
  const initRef = useRef(false);
  const deviceUuidRef = useRef<string | null>(null);
  const senderKeyCreatedAt = useRef<Map<string, number>>(new Map());

  /**
   * Initialize the device — generate keys, register with server.
   * Called during onboarding or when no local keys exist.
   */
  const initializeDevice = useCallback(
    async (pin: string) => {
      if (!userId || initRef.current) return;
      initRef.current = true;
      setStatus("initializing");

      try {
        const result = await setupDevice(cryptoStore, pin);

        // Store identity keys in IndexedDB
        // (setupDevice stores prekeys, but we need to also persist identity + signing)
        const { generateIdentityKeyPair, generateRegistrationId } =
          await import("@openhospi/crypto");

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

        deviceUuidRef.current = device.id;
        setStatus("ready");
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setStatus("error");
        initRef.current = false;
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
        setStatus("ready");

        // Run key maintenance in the background
        if (deviceUuidRef.current) {
          const deviceId = deviceUuidRef.current;
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
  }, []);

  /**
   * Ensure 1:1 sessions exist with all member devices.
   * Fetches pre-key bundles and runs X3DH for any device we don't have a session with.
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
   * Encrypts the distribution message via each member's 1:1 session.
   */
  const distributeSenderKey = useCallback(
    async (conversationId: string, memberUserIds: string[]) => {
      if (!userId || !deviceUuidRef.current) return;

      // Collect all member device addresses
      const memberAddresses: ProtocolAddress[] = [];
      for (const memberId of memberUserIds) {
        const memberDevices = await fetchDevicesForUser(memberId);
        for (const d of memberDevices) {
          memberAddresses.push({ userId: memberId, deviceId: d.id });
        }
      }

      const localAddress: ProtocolAddress = { userId, deviceId: deviceUuidRef.current };

      const { distributions } = await initAndDistributeSenderKey(
        cryptoStore,
        localAddress,
        conversationId,
        memberAddresses,
      );

      // Upload encrypted distributions to server
      for (const dist of distributions) {
        await storeSenderKeyDist({
          conversationId,
          senderDeviceId: deviceUuidRef.current,
          recipientDeviceId: dist.recipientAddress.deviceId,
          ciphertext: toBase64(dist.encryptedDistribution),
        });
      }
    },
    [userId],
  );

  /**
   * Encrypt a message for a group conversation.
   * THE CRITICAL FLOW:
   *   1. ensureSessions → 2. distributeSenderKey → 3. encryptGroupMessage
   */
  const encryptMessage = useCallback(
    async (conversationId: string, memberUserIds: string[], plaintext: string): Promise<string> => {
      if (!userId) throw new Error("Not authenticated");

      // Step 1: Ensure 1:1 sessions with all members
      await ensureSessions(memberUserIds);

      // Step 2: Check if we have a sender key, rotate if needed, distribute if missing
      if (!deviceUuidRef.current) throw new Error("Device not initialized");
      const localAddress: ProtocolAddress = { userId, deviceId: deviceUuidRef.current };

      const existingKey = await cryptoStore.loadSenderKey(localAddress, conversationId);
      const createdAt = senderKeyCreatedAt.current.get(conversationId) ?? 0;
      const needsRotation = existingKey && shouldRotateSenderKey(existingKey, createdAt);

      if (!existingKey || needsRotation) {
        await distributeSenderKey(conversationId, memberUserIds);
        senderKeyCreatedAt.current.set(conversationId, Date.now());
      }

      // Step 3: Encrypt with sender key (O(1))
      const { encodeUtf8 } = await import("@openhospi/crypto");
      const message = await cryptoEncryptGroup(
        cryptoStore,
        localAddress,
        conversationId,
        encodeUtf8(plaintext),
      );

      // Return serialised payload
      return JSON.stringify({
        distributionId: message.distributionId,
        chainId: message.chainId,
        ciphertext: toBase64(message.ciphertext),
        signature: toBase64(message.signature),
      });
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
          const { decodeUtf8 } = await import("@openhospi/crypto");
          const plaintext = await decryptGroupMessage(
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

      // Periodic cleanup
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

      const message = {
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
        // Queue for retry — sender key distribution may not have arrived yet
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

      // Fetch remote user's signing key
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

          // Decrypt the distribution message via 1:1 session
          const distributionBytes = await decrypt1to1(
            cryptoStore,
            senderAddress,
            fromBase64(dist.ciphertext),
          );

          // Process the distribution
          await processDistribution(cryptoStore, senderAddress, distributionBytes);

          // Acknowledge
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
    initializeDevice,
    checkStatus,
    ensureSessions,
    distributeSenderKey,
    encryptMessage,
    processIncomingDistribution,
    decryptMessage,
    getSafetyNumber,
    processPendingDistributions,
    sentMessageCache,
  };
}
