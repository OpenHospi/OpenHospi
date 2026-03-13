/**
 * React Query hook for tracking encryption key lifecycle on mobile.
 */
import {
  setCryptoProvider,
  getKeyStatus,
  setupKeysWithPIN,
  recoverKeysWithPIN,
} from '@openhospi/crypto';
import { createNativeCryptoProvider } from '@openhospi/crypto/native';
import type { KeyStatus, EncryptedBackup } from '@openhospi/crypto';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { useSession } from '@/lib/auth-client';
import { getMobileSignalStore } from '@/lib/crypto/stores';
import { queryKeys } from '@/services/keys';

let providerInitialized = false;

function ensureCryptoProvider() {
  if (!providerInitialized) {
    setCryptoProvider(createNativeCryptoProvider());
    providerInitialized = true;
  }
}

export function useEncryptionKey() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  const statusQuery = useQuery({
    queryKey: queryKeys.encryption.status(),
    queryFn: async () => {
      ensureCryptoProvider();
      const store = getMobileSignalStore();
      return getKeyStatus(store);
    },
    enabled: !!userId,
  });

  const setupMutation = useMutation({
    mutationFn: async (pin: string) => {
      ensureCryptoProvider();
      const store = getMobileSignalStore();
      const result = await setupKeysWithPIN(store, pin);

      // Store identity key pair in SQLite
      const identity = await store.getIdentityKeyPair();
      await getMobileSignalStore().storeIdentityKeyPair(identity, result.registrationId);

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.encryption.status() });
    },
  });

  const recoverMutation = useMutation({
    mutationFn: async ({ backup, pin }: { backup: EncryptedBackup; pin: string }) => {
      ensureCryptoProvider();
      return recoverKeysWithPIN(backup, pin);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.encryption.status() });
    },
  });

  return {
    status: statusQuery.data ?? null,
    isLoading: statusQuery.isLoading,
    setupKeys: setupMutation.mutateAsync,
    recoverKeys: recoverMutation.mutateAsync,
    isSettingUp: setupMutation.isPending,
    isRecovering: recoverMutation.isPending,
  };
}

export type { KeyStatus, EncryptedBackup };
