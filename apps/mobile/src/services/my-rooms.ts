import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { queryKeys } from './keys';
import type { MyRoomDetail, MyRoomSummary, OwnerHouse, RoomDetailPhoto } from './types';

// ── Queries ─────────────────────────────────────────────────

export function useMyRooms() {
  return useQuery({
    queryKey: queryKeys.myRooms.list(),
    queryFn: () => api.get<{ rooms: MyRoomSummary[] }>('/api/mobile/my-rooms').then((r) => r.rooms),
  });
}

export function useMyRoom(id: string) {
  return useQuery({
    queryKey: queryKeys.myRooms.detail(id),
    queryFn: () =>
      api.get<{ room: MyRoomDetail }>(`/api/mobile/my-rooms/${id}`).then((r) => r.room),
    enabled: !!id,
  });
}

export function useOwnerHouses() {
  return useQuery({
    queryKey: queryKeys.myRooms.houses(),
    queryFn: () =>
      api.get<{ houses: OwnerHouse[] }>('/api/mobile/my-rooms/houses').then((r) => r.houses),
  });
}

// ── House + Draft Creation ──────────────────────────────────

export function useCreateHouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.post<{ id: string }>('/api/mobile/my-rooms/houses', { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myRooms.houses() });
    },
  });
}

export function useCreateDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (houseId: string) =>
      api.post<{ id: string }>(`/api/mobile/my-rooms/houses/${houseId}/draft`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myRooms.list() });
    },
  });
}

// ── Wizard Steps ────────────────────────────────────────────

export function useSaveBasicInfo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roomId, data }: { roomId: string; data: Record<string, unknown> }) =>
      api.patch(`/api/mobile/my-rooms/${roomId}/basic-info`, data),
    onSuccess: (_data, { roomId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myRooms.detail(roomId) });
    },
  });
}

export function useSaveDetails() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roomId, data }: { roomId: string; data: Record<string, unknown> }) =>
      api.patch(`/api/mobile/my-rooms/${roomId}/details`, data),
    onSuccess: (_data, { roomId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myRooms.detail(roomId) });
    },
  });
}

export function useSavePreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roomId, data }: { roomId: string; data: Record<string, unknown> }) =>
      api.patch(`/api/mobile/my-rooms/${roomId}/preferences`, data),
    onSuccess: (_data, { roomId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myRooms.detail(roomId) });
    },
  });
}

export function usePublishRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (roomId: string) => api.post(`/api/mobile/my-rooms/${roomId}/publish`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myRooms.list() });
    },
  });
}

// ── Photo Management ────────────────────────────────────────

export function useUploadRoomPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roomId, uri, slot }: { roomId: string; uri: string; slot: number }) => {
      const formData = new FormData();
      formData.append('file', {
        uri,
        type: 'image/jpeg',
        name: `slot-${slot}.jpg`,
      } as unknown as Blob);
      formData.append('slot', String(slot));
      return api.postFormData<{ photo: RoomDetailPhoto }>(
        `/api/mobile/my-rooms/${roomId}/photos`,
        formData
      );
    },
    onSuccess: (_data, { roomId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myRooms.detail(roomId) });
    },
  });
}

export function useDeleteRoomPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roomId, slot }: { roomId: string; slot: number }) =>
      api.delete(`/api/mobile/my-rooms/${roomId}/photos/${slot}`),
    onSuccess: (_data, { roomId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myRooms.detail(roomId) });
    },
  });
}

// ── Room Management ─────────────────────────────────────────

export function useUpdateRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roomId, data }: { roomId: string; data: Record<string, unknown> }) =>
      api.patch(`/api/mobile/my-rooms/${roomId}`, data),
    onSuccess: (_data, { roomId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myRooms.detail(roomId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.myRooms.list() });
    },
  });
}

export function useUpdateRoomStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roomId, status }: { roomId: string; status: string }) =>
      api.patch(`/api/mobile/my-rooms/${roomId}/status`, { status }),
    onSuccess: (_data, { roomId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myRooms.detail(roomId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.myRooms.list() });
    },
  });
}

export function useDeleteRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (roomId: string) => api.delete(`/api/mobile/my-rooms/${roomId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myRooms.list() });
    },
  });
}

export function useRegenerateShareLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (roomId: string) =>
      api.post(`/api/mobile/my-rooms/${roomId}/share-link/regenerate`),
    onSuccess: (_data, roomId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myRooms.detail(roomId) });
    },
  });
}

export function useUpdateShareLinkSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roomId, data }: { roomId: string; data: Record<string, unknown> }) =>
      api.patch(`/api/mobile/my-rooms/${roomId}/share-link`, data),
    onSuccess: (_data, { roomId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myRooms.detail(roomId) });
    },
  });
}
