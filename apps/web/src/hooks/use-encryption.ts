"use client";

import {
  getKeyStatus,
  encryptGroupMessage as encryptGroupMessageFn,
  decryptGroupMessage as decryptGroupMessageFn,
  getIdentityFingerprint,
} from "@openhospi/crypto";
import type { GroupCiphertextPayload, KeyStatus, FingerprintResult } from "@openhospi/crypto";
import { useCallback, useEffect, useState } from "react";

import {
  fetchKeyBackup,
  fetchPreKeyBundle,
  fetchIdentityKeys,
  storeSenderKeyDistributions,
  fetchSenderKeyDistribution,
  getExistingDistributionRecipients,
} from "@/app/[locale]/(app)/chat/key-actions";
import { cryptoStore } from "@/lib/crypto";

type UseEncryptionResult = {
  status: "loading" | KeyStatus;
  encryptGroupMessage: (
    conversationId: string,
    memberUserIds: string[],
    plaintext: string,
  ) => Promise<GroupCiphertextPayload>;
  decryptGroupMessage: (
    conversationId: string,
    senderUserId: string,
    payload: GroupCiphertextPayload,
  ) => Promise<string>;
  getFingerprint: (otherUserId: string) => Promise<FingerprintResult | null>;
};

export function useEncryption(userId: string): UseEncryptionResult {
  const [status, setStatus] = useState<"loading" | KeyStatus>("loading");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const keyStatus = await getKeyStatus(cryptoStore, userId, fetchKeyBackup);
      if (!cancelled) setStatus(keyStatus);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const encryptGroupMessage = useCallback(
    async (
      conversationId: string,
      memberUserIds: string[],
      plaintext: string,
    ): Promise<GroupCiphertextPayload> => {
      return encryptGroupMessageFn(
        cryptoStore,
        userId,
        conversationId,
        memberUserIds,
        plaintext,
        async (targetUserId) => {
          const bundle = await fetchPreKeyBundle(targetUserId);
          return bundle ?? null;
        },
        async (distributions) => {
          await storeSenderKeyDistributions(conversationId, distributions);
        },
        getExistingDistributionRecipients,
      );
    },
    [userId],
  );

  const decryptGroupMessage = useCallback(
    async (
      conversationId: string,
      senderUserId: string,
      payload: GroupCiphertextPayload,
    ): Promise<string> => {
      return decryptGroupMessageFn(
        cryptoStore,
        userId,
        conversationId,
        senderUserId,
        payload,
        fetchSenderKeyDistribution,
      );
    },
    [userId],
  );

  const getFingerprint = useCallback(
    async (otherUserId: string): Promise<FingerprintResult | null> => {
      return getIdentityFingerprint(cryptoStore, userId, otherUserId, async (userIds) => {
        const keys = await fetchIdentityKeys(userIds);
        return keys.map((k) => ({ signingPublicKey: k.signingPublicKey }));
      });
    },
    [userId],
  );

  return { status, encryptGroupMessage, decryptGroupMessage, getFingerprint };
}
