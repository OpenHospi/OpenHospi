"use client";

import { importPrivateKey } from "@openhospi/crypto";
import { useEffect, useState } from "react";

import { fetchKeyBackup } from "@/app/[locale]/(app)/chat/key-actions";
import { getStoredPrivateKey } from "@/lib/crypto-store";
import type { KeyStatus } from "@/lib/key-management";

type UseEncryptionKeyResult = {
  privateKey: CryptoKey | null;
  status: "loading" | KeyStatus;
  backupType: "passkey" | "pin" | null;
};

export function useEncryptionKey(userId: string): UseEncryptionKeyResult {
  const [privateKey, setPrivateKey] = useState<CryptoKey | null>(null);
  const [status, setStatus] = useState<"loading" | KeyStatus>("loading");
  const [backupType, setBackupType] = useState<"passkey" | "pin" | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // 1. Check IndexedDB
      const storedJwk = await getStoredPrivateKey(userId);
      if (storedJwk) {
        const key = await importPrivateKey(storedJwk);
        if (!cancelled) {
          setPrivateKey(key);
          setStatus("ready");
        }
        return;
      }

      // 2. Check server for backup
      const backup = await fetchKeyBackup();
      if (!cancelled) {
        if (backup) {
          setBackupType(backup.backupType as "passkey" | "pin");
          setStatus("needs-recovery");
        } else {
          setStatus("needs-setup");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { privateKey, status, backupType };
}
