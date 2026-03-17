"use client";

import {
  getKeyStatus,
  encryptGroupMessage as encryptGroupMessageFn,
  decryptGroupMessage as decryptGroupMessageFn,
  generateSafetyNumber,
  toBase64,
  fromBase64 as fromBase64Fn,
} from "@openhospi/crypto";
import type { GroupCiphertextPayload, KeyStatus, ProtocolAddress } from "@openhospi/crypto";
import { useCallback, useEffect, useState } from "react";

import { cryptoStore } from "@/lib/crypto";

import { fetchDevicesForUser } from "@/app/[locale]/(app)/chat/key-actions";

type UseEncryptionResult = {
  status: "loading" | KeyStatus;
  encryptGroupMessage: (
    conversationId: string,
    memberUserIds: string[],
    plaintext: string,
  ) => Promise<string>;
  decryptGroupMessage: (
    conversationId: string,
    senderUserId: string,
    serializedPayload: string,
  ) => Promise<string>;
  getSafetyNumber: (remoteUserId: string) => Promise<string>;
};

function serializePayload(payload: GroupCiphertextPayload): string {
  return JSON.stringify({
    senderKeyId: payload.senderKeyId,
    iteration: payload.iteration,
    ciphertext: toBase64(payload.ciphertext),
    signature: toBase64(payload.signature),
  });
}

function deserializePayload(data: string): GroupCiphertextPayload {
  const parsed = JSON.parse(data) as {
    senderKeyId: number;
    iteration: number;
    ciphertext: string;
    signature: string;
  };
  return {
    senderKeyId: parsed.senderKeyId,
    iteration: parsed.iteration,
    ciphertext: fromBase64Fn(parsed.ciphertext),
    signature: fromBase64Fn(parsed.signature),
  };
}

export function useEncryption(userId: string): UseEncryptionResult {
  const [status, setStatus] = useState<"loading" | KeyStatus>("loading");

  // Web uses deviceId 1 for now (Phase 7 will add multi-device for web)
  const deviceId = 1;
  const localAddress: ProtocolAddress = { name: userId, deviceId };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const keyStatus = await getKeyStatus(cryptoStore);
      if (!cancelled) setStatus(keyStatus);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const encryptGroupMessage = useCallback(
    async (
      conversationId: string,
      _memberUserIds: string[],
      plaintext: string,
    ): Promise<string> => {
      const { payload } = await encryptGroupMessageFn(
        cryptoStore,
        localAddress,
        conversationId,
        plaintext,
        userId,
      );
      return serializePayload(payload);
    },
    [userId, localAddress],
  );

  const decryptGroupMessage = useCallback(
    async (
      conversationId: string,
      senderUserId: string,
      serializedPayload: string,
    ): Promise<string> => {
      const payload = deserializePayload(serializedPayload);
      const senderAddress: ProtocolAddress = { name: senderUserId, deviceId: 1 };
      return decryptGroupMessageFn(
        cryptoStore,
        senderAddress,
        conversationId,
        payload,
        senderUserId,
      );
    },
    [],
  );

  const getSafetyNumber = useCallback(
    async (remoteUserId: string): Promise<string> => {
      // Fetch remote user's device to get their identity key
      const remoteDevices = await fetchDevicesForUser(remoteUserId);
      if (remoteDevices.length === 0) {
        throw new Error("No devices found for remote user");
      }
      const remoteIdentityKey = fromBase64Fn(remoteDevices[0].identityKeyPublic);

      const identity = await cryptoStore.getIdentityKeyPair();
      return generateSafetyNumber(
        userId,
        identity.signingKeyPair.publicKey,
        remoteUserId,
        remoteIdentityKey,
      );
    },
    [userId],
  );

  return { status, encryptGroupMessage, decryptGroupMessage, getSafetyNumber };
}
