import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { queryKeys } from './keys';
import type { ApplicationDetail, UserApplication } from './types';

export function useApplications() {
  return useQuery({
    queryKey: queryKeys.applications.list(),
    queryFn: () => api.get<UserApplication[]>('/api/mobile/applications'),
  });
}

export function useApplicationDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.applications.detail(id),
    queryFn: () => api.get<ApplicationDetail>(`/api/mobile/applications/${id}`),
    enabled: !!id,
  });
}

export function useWithdrawApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/api/mobile/applications/${id}/withdraw`),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.applications.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.applications.detail(id) });
    },
  });
}
