import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { STALE_TIMES } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import { createMutationErrorHandler } from '@/lib/mutation-error';

import { queryKeys } from './keys';
import type {
  ActiveConsent,
  CalendarTokenInfo,
  ConsentHistoryRecord,
  ProcessingRestrictionInfo,
  SessionInfo,
} from '@openhospi/shared/api-types';

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

export function useProcessingRestriction() {
  return useQuery({
    queryKey: queryKeys.settings.processingRestriction(),
    queryFn: () =>
      api.get<ProcessingRestrictionInfo>('/api/mobile/settings/processing-restriction'),
    staleTime: STALE_TIMES.settings,
  });
}

export function useActivateProcessingRestriction() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const onError = createMutationErrorHandler(showToast);
  return useMutation({
    mutationFn: (data: { reason: string }) =>
      api.post('/api/mobile/settings/processing-restriction', data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.processingRestriction() }),
    onError,
  });
}

export function useLiftProcessingRestriction() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const onError = createMutationErrorHandler(showToast);
  return useMutation({
    mutationFn: () => api.delete('/api/mobile/settings/processing-restriction'),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.processingRestriction() }),
    onError,
  });
}

export function useConsentHistory() {
  return useQuery({
    queryKey: queryKeys.settings.consentHistory(),
    queryFn: () => api.get<ConsentHistoryRecord[]>('/api/mobile/settings/consent-history'),
    staleTime: STALE_TIMES.settings,
  });
}

export function useCalendarToken() {
  return useQuery({
    queryKey: queryKeys.settings.calendarToken(),
    queryFn: () => api.get<CalendarTokenInfo>('/api/mobile/settings/calendar-token'),
    staleTime: STALE_TIMES.settings,
  });
}

export function useRegenerateCalendarToken() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const onError = createMutationErrorHandler(showToast);
  return useMutation({
    mutationFn: () => api.post<CalendarTokenInfo>('/api/mobile/settings/calendar-token'),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.calendarToken() }),
    onError,
  });
}
