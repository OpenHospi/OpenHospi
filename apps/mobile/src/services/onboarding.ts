import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { queryKeys } from './keys';
import type { OnboardingStatus } from './types';

export function useOnboardingStatus() {
  return useQuery({
    queryKey: queryKeys.onboarding.status(),
    queryFn: () => api.get<OnboardingStatus>('/api/mobile/onboarding/status'),
  });
}

export function useSubmitIdentity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { firstName: string; lastName: string; email: string }) =>
      api.post('/api/mobile/onboarding/identity', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.onboarding.status() }),
  });
}

export function useVerifyEmail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { email: string; code: string }) =>
      api.post('/api/mobile/onboarding/verify-email', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.onboarding.status() }),
  });
}

export function useResendCode() {
  return useMutation({
    mutationFn: (data: { email: string }) => api.post('/api/mobile/onboarding/resend-code', data),
  });
}

export function useSubmitAbout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post('/api/mobile/onboarding/about', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.onboarding.status() }),
  });
}

export function useSubmitBio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { bio: string }) => api.post('/api/mobile/onboarding/bio', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.onboarding.status() }),
  });
}

export function useSubmitPersonality() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { lifestyleTags: string[] }) =>
      api.post('/api/mobile/onboarding/personality', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.onboarding.status() }),
  });
}

export function useSubmitLanguages() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { languages: string[] }) =>
      api.post('/api/mobile/onboarding/languages', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.onboarding.status() }),
  });
}
