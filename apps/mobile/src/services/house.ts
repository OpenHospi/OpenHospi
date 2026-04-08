import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, NetworkError } from '@/lib/api-client';
import { STALE_TIMES } from '@/lib/constants';
import { getNetworkStatus } from '@/lib/network';
import { useToast } from '@/hooks/use-toast';
import { createMutationErrorHandler } from '@/lib/mutation-error';

import { queryKeys } from './keys';

type HouseMember = {
  userId: string;
  role: string;
  joinedAt: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
};

type MyHouseResponse = {
  house: {
    id: string;
    name: string;
    inviteCode: string;
    createdAt: string;
  } | null;
  members: HouseMember[];
  currentUserRole: string | null;
};

type JoinHousePreview = {
  house: { id: string; name: string };
};

export function useMyHouse() {
  return useQuery({
    queryKey: queryKeys.house.detail(),
    queryFn: () => api.get<MyHouseResponse>('/api/mobile/my-house'),
    staleTime: STALE_TIMES.houses,
  });
}

export function useRegenerateInviteCode() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const onError = createMutationErrorHandler(showToast);

  return useMutation({
    mutationFn: () => {
      const { isOnline } = getNetworkStatus();
      if (!isOnline) throw new NetworkError();
      return api.post<{ inviteCode: string }>('/api/mobile/my-house', {
        action: 'regenerate-invite-code',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.house.detail() });
    },
    onError,
  });
}

export function useJoinHousePreview(code: string) {
  return useQuery({
    queryKey: queryKeys.house.joinPreview(code),
    queryFn: () => api.get<JoinHousePreview>(`/api/mobile/join/${code}`),
    enabled: !!code,
  });
}

export function useJoinHouse() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const onError = createMutationErrorHandler(showToast);

  return useMutation({
    mutationFn: (code: string) => {
      const { isOnline } = getNetworkStatus();
      if (!isOnline) throw new NetworkError();
      return api.post<JoinHousePreview>(`/api/mobile/join/${code}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.house.detail() });
      queryClient.invalidateQueries({ queryKey: queryKeys.myRooms.houses() });
    },
    onError,
  });
}
