import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import { createMutationErrorHandler } from '@/lib/mutation-error';

import { queryKeys } from './keys';
import type { OnboardingStatus } from '@openhospi/shared/api-types';

export function useOnboardingStatus(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.onboarding.status(),
    queryFn: () => api.get<OnboardingStatus>('/api/mobile/onboarding/status'),
    enabled: options?.enabled,
  });
}

export function useSubmitIdentity() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const onError = createMutationErrorHandler(showToast);
  return useMutation({
    mutationFn: (data: { firstName: string; lastName: string; email: string }) =>
      api.post('/api/mobile/onboarding/identity', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.onboarding.status() }),
    onError,
  });
}

export function useVerifyEmail() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const onError = createMutationErrorHandler(showToast);
  return useMutation({
    mutationFn: (data: { email: string; code: string }) =>
      api.post('/api/mobile/onboarding/verify-email', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.onboarding.status() }),
    onError,
  });
}

export function useResendCode() {
  const { showToast } = useToast();
  const onError = createMutationErrorHandler(showToast);
  return useMutation({
    mutationFn: (data: { email: string }) => api.post('/api/mobile/onboarding/resend-code', data),
    onError,
  });
}

type SubmitAboutPayload = {
  gender?: string;
  birthDate?: string;
  studyProgram?: string;
  studyLevel?: string;
  preferredCity?: string;
  vereniging?: string;
};

export function useSubmitAbout() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const onError = createMutationErrorHandler(showToast);
  return useMutation({
    mutationFn: (data: SubmitAboutPayload) => api.post('/api/mobile/onboarding/about', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.onboarding.status() }),
    onError,
  });
}

export function useSubmitBio() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const onError = createMutationErrorHandler(showToast);
  return useMutation({
    mutationFn: (data: { bio: string }) => api.post('/api/mobile/onboarding/bio', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.onboarding.status() }),
    onError,
  });
}

export function useSubmitPersonality() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const onError = createMutationErrorHandler(showToast);
  return useMutation({
    mutationFn: (data: { lifestyleTags: string[] }) =>
      api.post('/api/mobile/onboarding/personality', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.onboarding.status() }),
    onError,
  });
}

export function useSubmitLanguages() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const onError = createMutationErrorHandler(showToast);
  return useMutation({
    mutationFn: (data: { languages: string[] }) =>
      api.post('/api/mobile/onboarding/languages', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.onboarding.status() }),
    onError,
  });
}
