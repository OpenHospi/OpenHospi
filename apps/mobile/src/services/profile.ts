import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import { getCookie } from '@better-auth/expo/client';

import { api, ApiError } from '@/lib/api-client';
import { API_BASE_URL, STALE_TIMES, STORAGE_PREFIX } from '@/lib/constants';

import { queryKeys } from './keys';
import type { ProfileWithPhotos } from '@openhospi/shared/api-types';

const COOKIE_STORE_KEY = `${STORAGE_PREFIX}_cookie`;

export function useProfile() {
  return useQuery({
    queryKey: queryKeys.profile.detail(),
    queryFn: () => api.get<ProfileWithPhotos>('/api/mobile/profile'),
    staleTime: STALE_TIMES.profile,
  });
}

type UpdateProfilePayload = Partial<{
  firstName: string;
  lastName: string;
  bio: string;
  gender: string | null;
  birthDate: string;
  preferredCity: string | null;
  studyProgram: string;
  studyLevel: string;
  vereniging: string | null;
  lifestyleTags: string[];
  languages: string[];
}>;

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateProfilePayload) => api.patch('/api/mobile/profile', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.profile.detail() }),
  });
}

export function useUploadProfilePhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      file,
      slot,
    }: {
      file: { uri: string; name: string; type: string };
      slot: number;
    }) => {
      const raw = await SecureStore.getItemAsync(COOKIE_STORE_KEY);
      const headers: Record<string, string> = {};
      if (raw) {
        const cookie = getCookie(raw);
        if (cookie) headers['Cookie'] = cookie;
      }

      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.type,
      } as unknown as Blob);
      formData.append('slot', String(slot));

      const response = await fetch(`${API_BASE_URL}/api/mobile/profile/photos`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new ApiError(response.status, (error as { error?: string }).error ?? 'Upload failed');
      }

      return response.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.profile.detail() }),
  });
}

export function useDeleteProfilePhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (slot: number) => api.delete(`/api/mobile/profile/photos/${slot}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.profile.detail() }),
  });
}
