import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';

import { api } from '@/lib/api-client';

import { queryKeys } from './keys';
import type { ProfileWithPhotos } from './types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://openhospi.nl';
const TOKEN_KEY = 'openhospi_bearer_token';

export function useProfile() {
  return useQuery({
    queryKey: queryKeys.profile.detail(),
    queryFn: () => api.get<ProfileWithPhotos>('/api/mobile/profile'),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.patch('/api/mobile/profile', data),
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
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.type,
      } as unknown as Blob);
      formData.append('slot', String(slot));

      const response = await fetch(`${API_BASE_URL}/api/mobile/profile/photos`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error((error as { error?: string }).error ?? 'Upload failed');
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
