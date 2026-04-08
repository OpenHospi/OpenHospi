import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { STALE_TIMES } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import { createMutationErrorHandler } from '@/lib/mutation-error';

import { queryKeys } from './keys';
import type { ActiveConsent, SessionInfo } from '@openhospi/shared/api-types';

export function useConsent() {
  return useQuery({
    queryKey: queryKeys.settings.consent(),
    queryFn: () => api.get<ActiveConsent[]>('/api/mobile/settings/consent'),
    staleTime: STALE_TIMES.settings,
  });
}

export function useUpdateConsent() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const onError = createMutationErrorHandler(showToast);
  return useMutation({
    mutationFn: (data: { purpose: string; granted: boolean }) =>
      api.patch('/api/mobile/settings/consent', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.settings.consent() }),
    onError,
  });
}

export function useSessions() {
  return useQuery({
    queryKey: queryKeys.settings.sessions(),
    queryFn: () => api.get<SessionInfo[]>('/api/mobile/settings/sessions'),
    staleTime: STALE_TIMES.settings,
  });
}

export function useRevokeSession() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const onError = createMutationErrorHandler(showToast);
  return useMutation({
    mutationFn: (sessionId: string) => api.delete(`/api/mobile/settings/sessions/${sessionId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.settings.sessions() }),
    onError,
  });
}

export function useExportData() {
  const { showToast } = useToast();
  const onError = createMutationErrorHandler(showToast);
  return useMutation({
    mutationFn: () =>
      api.post<{ data: Record<string, unknown> }>('/api/mobile/settings/data-export'),
    onError,
  });
}

export function useSubmitDataRequest() {
  const { showToast } = useToast();
  const onError = createMutationErrorHandler(showToast);
  return useMutation({
    mutationFn: (data: { type: string; description?: string }) =>
      api.post('/api/mobile/settings/data-request', data),
    onError,
  });
}

export function useDeleteAccount() {
  const { showToast } = useToast();
  const onError = createMutationErrorHandler(showToast);
  return useMutation({
    mutationFn: () => api.post('/api/mobile/settings/delete-account'),
    onError,
  });
}
