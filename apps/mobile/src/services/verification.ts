import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { eq } from 'drizzle-orm';

import { db } from '@/lib/db';
import { keyVerifications } from '@/lib/db/schema';
import { STALE_TIMES } from '@/lib/constants';
import type { IdentityKeyResult } from '@openhospi/shared/api-types';
import { api } from '@/lib/api-client';
import { queryKeys } from './keys';

// ── SQLite operations ──

export async function getVerification(peerUserId: string) {
  const [row] = await db
    .select()
    .from(keyVerifications)
    .where(eq(keyVerifications.peerUserId, peerUserId));
  return row ?? null;
}

export async function saveVerification(peerUserId: string, signingPublicKey: string) {
  await db
    .insert(keyVerifications)
    .values({ peerUserId, signingPublicKey, verifiedAt: new Date() })
    .onConflictDoUpdate({
      target: keyVerifications.peerUserId,
      set: { signingPublicKey, verifiedAt: new Date() },
    });
}

export async function deleteVerification(peerUserId: string) {
  await db.delete(keyVerifications).where(eq(keyVerifications.peerUserId, peerUserId));
}

// ── API call ──

export async function fetchIdentityKeysApi(userIds: string[]): Promise<IdentityKeyResult[]> {
  return api.post<IdentityKeyResult[]>('/api/mobile/keys/identity/batch', { userIds });
}

// ── React Query hooks ──

export function useVerificationStatus(peerUserId: string) {
  const query = useQuery({
    queryKey: queryKeys.verification.status(peerUserId),
    queryFn: () => getVerification(peerUserId),
    enabled: !!peerUserId,
    staleTime: STALE_TIMES.verification,
  });

  return {
    isVerified: !!query.data,
    verifiedAt: query.data?.verifiedAt ?? undefined,
    signingPublicKey: query.data?.signingPublicKey ?? undefined,
    isLoading: query.isLoading,
  };
}

export function useSaveVerification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      peerUserId,
      signingPublicKey,
    }: {
      peerUserId: string;
      signingPublicKey: string;
    }) => {
      await saveVerification(peerUserId, signingPublicKey);
    },
    onSuccess: (_data, { peerUserId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.verification.status(peerUserId),
      });
    },
  });
}

export function useKeyChangeDetection(peerUserId: string) {
  const { signingPublicKey: verifiedKey, isVerified } = useVerificationStatus(peerUserId);

  const { data: serverKeys, isError } = useQuery({
    queryKey: queryKeys.verification.identityKeys([peerUserId]),
    queryFn: () => fetchIdentityKeysApi([peerUserId]),
    enabled: !!peerUserId && isVerified,
    staleTime: STALE_TIMES.verification,
  });

  const currentSigningKey = serverKeys?.[0]?.signingPublicKey;
  const hasChanged =
    isVerified && !!currentSigningKey && !!verifiedKey && verifiedKey !== currentSigningKey;

  return { hasChanged, isVerified, isError };
}
