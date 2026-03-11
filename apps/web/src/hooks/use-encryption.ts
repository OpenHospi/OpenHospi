"use client";

import {
  getKeyStatus,
  encryptForRecipient,
  decryptFromSender,
  getIdentityFingerprint,
} from "@openhospi/crypto";
import type { EncryptedMessage, KeyStatus, FingerprintResult } from "@openhospi/crypto";
import { useCallback, useEffect, useState } from "react";

import {
  fetchKeyBackup,
  fetchPreKeyBundle,
  fetchIdentityKeys,
} from "@/app/[locale]/(app)/chat/key-actions";
import { cryptoStore } from "@/lib/crypto";

type UseEncryptionResult = {
  status: "loading" | KeyStatus;
  encryptMessage: (
    conversationId: string,
    recipientUserId: string,
    plaintext: string,
  ) => Promise<EncryptedMessage>;
  decryptMessage: (
    conversationId: string,
    senderUserId: string,
    encrypted: EncryptedMessage,
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

  const encryptMessage = useCallback(
    async (
      conversationId: string,
      recipientUserId: string,
      plaintext: string,
    ): Promise<EncryptedMessage> => {
      return encryptForRecipient(
        cryptoStore,
        userId,
        conversationId,
        recipientUserId,
        plaintext,
        async (targetUserId) => {
          const bundle = await fetchPreKeyBundle(targetUserId);
          if (!bundle) return null;
          return bundle;
        },
      );
    },
    [userId],
  );

  const decryptMessage = useCallback(
    async (
      conversationId: string,
      senderUserId: string,
      encrypted: EncryptedMessage,
    ): Promise<string> => {
      return decryptFromSender(cryptoStore, userId, conversationId, senderUserId, encrypted);
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

  return { status, encryptMessage, decryptMessage, getFingerprint };
}
