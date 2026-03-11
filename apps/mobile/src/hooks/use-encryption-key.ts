import { getKeyStatus } from '@openhospi/crypto';
import type { KeyStatus, StoredIdentity } from '@openhospi/crypto';
import { useQuery } from '@tanstack/react-query';

import { useSession } from '@/lib/auth-client';
import { cryptoStore } from '@/lib/crypto/store';
import { fetchBackupApi } from '@/services/encryption';
import { queryKeys } from '@/services/keys';

export function useEncryptionKey() {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const statusQuery = useQuery({
    queryKey: queryKeys.encryption.status(),
    queryFn: () => getKeyStatus(cryptoStore, userId!, fetchBackupApi),
    enabled: !!userId,
  });

  const identityQuery = useQuery({
    queryKey: ['encryption', 'identity', userId],
    queryFn: () => cryptoStore.getStoredIdentity(userId!),
    enabled: !!userId && statusQuery.data === 'ready',
  });

  return {
    status: (statusQuery.data ?? 'needs-setup') as KeyStatus,
    identity: identityQuery.data ?? null,
    isLoading: statusQuery.isLoading,
  };
}

export type { KeyStatus, StoredIdentity };
