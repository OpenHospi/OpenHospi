import { useQuery } from '@tanstack/react-query';

import { useSession } from '@/lib/auth-client';
import { getKeyStatus, importAndStoreKey, type KeyStatus } from '@/lib/crypto/key-management';
import { fetchBackupApi } from '@/services/encryption';
import { queryKeys } from '@/services/keys';

export function useEncryptionKey() {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const statusQuery = useQuery({
    queryKey: queryKeys.encryption.status(),
    queryFn: () => getKeyStatus(userId!, fetchBackupApi),
    enabled: !!userId,
  });

  const keyQuery = useQuery({
    queryKey: ['encryption', 'privateKey', userId],
    queryFn: () => importAndStoreKey(userId!),
    enabled: !!userId && statusQuery.data === 'ready',
  });

  return {
    status: (statusQuery.data ?? 'needs-setup') as KeyStatus,
    privateKey: keyQuery.data ?? null,
    isLoading: statusQuery.isLoading,
  };
}
