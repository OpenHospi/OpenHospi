"use client";

import {
  getBackend,
  ratchetEncrypt,
  ratchetDecrypt,
  serializeRatchetState,
  deserializeRatchetState,
  generateSafetyNumber,
  fromBase64,
} from "@openhospi/crypto";
import type { EncryptedMessage } from "@openhospi/crypto";
import { useCallback, useEffect, useState } from "react";

import {
  fetchKeyBackup,
  fetchPreKeyBundle,
  fetchIdentityKeys,
} from "@/app/[locale]/(app)/chat/key-actions";
import { getKeyStatus, getOrCreateSession } from "@/lib/crypto/key-management";
import type { KeyStatus } from "@/lib/crypto/key-management";
import { getSession, getStoredIdentity, saveSession } from "@/lib/crypto/store";

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
  getIdentityFingerprint: (otherUserId: string) => Promise<string | null>;
};

export function useEncryption(userId: string): UseEncryptionResult {
  const [status, setStatus] = useState<"loading" | KeyStatus>("loading");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const keyStatus = await getKeyStatus(userId, fetchKeyBackup);
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
      const backend = getBackend();

      // Get or create DR session with this recipient
      const state = await getOrCreateSession(
        conversationId,
        recipientUserId,
        userId,
        async (targetUserId) => {
          const bundle = await fetchPreKeyBundle(targetUserId);
          if (!bundle) return null;
          return {
            identityKey: fromBase64(bundle.identityPublicKey),
            signingKey: fromBase64(bundle.signingPublicKey),
            signedPreKeyPublic: fromBase64(bundle.signedPreKeyPublic),
            signedPreKeyId: bundle.signedPreKeyId,
            signedPreKeySignature: fromBase64(bundle.signedPreKeySignature),
            oneTimePreKeyPublic: bundle.oneTimePreKeyPublic
              ? fromBase64(bundle.oneTimePreKeyPublic)
              : undefined,
            oneTimePreKeyId: bundle.oneTimePreKeyId,
          };
        },
      );

      // Encrypt with Double Ratchet
      const { state: newState, encrypted } = await ratchetEncrypt(backend, state, plaintext);

      // Persist updated session
      await saveSession(conversationId, recipientUserId, serializeRatchetState(newState));

      return encrypted;
    },
    [userId],
  );

  const decryptMessage = useCallback(
    async (
      conversationId: string,
      senderUserId: string,
      encrypted: EncryptedMessage,
    ): Promise<string> => {
      const backend = getBackend();

      // Get existing session
      const serialized = await getSession(conversationId, senderUserId);
      if (!serialized) {
        throw new Error("No session found for this sender — message cannot be decrypted");
      }

      const state = deserializeRatchetState(serialized);
      const { state: newState, plaintext } = await ratchetDecrypt(backend, state, encrypted);

      // Persist updated session
      await saveSession(conversationId, senderUserId, serializeRatchetState(newState));

      return plaintext;
    },
    [],
  );

  const getIdentityFingerprint = useCallback(
    async (otherUserId: string): Promise<string | null> => {
      const myIdentity = await getStoredIdentity(userId);
      if (!myIdentity) return null;

      const [theirKeys] = await fetchIdentityKeys([otherUserId]);
      if (!theirKeys) return null;

      return generateSafetyNumber(
        userId,
        fromBase64(myIdentity.signingPublicKey),
        otherUserId,
        fromBase64(theirKeys.signingPublicKey),
      );
    },
    [userId],
  );

  return { status, encryptMessage, decryptMessage, getIdentityFingerprint };
}
