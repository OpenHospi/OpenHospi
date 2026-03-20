import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { queryKeys } from './keys';
import type {
  MobileCloseRoomApplicant,
  MobileEventDetail,
  MobileEventSummary,
  MobileRoomApplicant,
  MobileVoteBoard,
  MobileVotableApplicant,
  MyRoomDetail,
  MyRoomSummary,
  OwnerHouse,
  RoomDetailPhoto,
} from './types';

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

// ── Applicants ─────────────────────────────────────────────

export function useRoomApplicants(roomId: string) {
  return useQuery({
    queryKey: queryKeys.myRooms.applicants(roomId),
    queryFn: () =>
      api
        .get<{ applicants: MobileRoomApplicant[] }>(`/api/mobile/my-rooms/${roomId}/applicants`)
        .then((r) => r.applicants),
    enabled: !!roomId,
  });
}

export function useMarkApplicationsSeen() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (roomId: string) => api.post(`/api/mobile/my-rooms/${roomId}/applicants/mark-seen`),
    onSuccess: (_data, roomId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myRooms.applicants(roomId) });
    },
  });
}

export function useSubmitReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      roomId,
      applicantUserId,
      data,
    }: {
      roomId: string;
      applicantUserId: string;
      data: { decision: string; notes?: string };
    }) => api.post(`/api/mobile/my-rooms/${roomId}/applicants/review/${applicantUserId}`, data),
    onSuccess: (_data, { roomId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myRooms.applicants(roomId) });
    },
  });
}

export function useUpdateApplicantStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      roomId,
      applicationId,
      status,
    }: {
      roomId: string;
      applicationId: string;
      status: string;
    }) =>
      api.patch(`/api/mobile/my-rooms/${roomId}/applicants/status/${applicationId}`, { status }),
    onSuccess: (_data, { roomId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myRooms.applicants(roomId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.myRooms.detail(roomId) });
    },
  });
}

// ── Events ─────────────────────────────────────────────────

export function useRoomEvents(roomId: string) {
  return useQuery({
    queryKey: queryKeys.myRooms.events(roomId),
    queryFn: () =>
      api
        .get<{ events: MobileEventSummary[] }>(`/api/mobile/my-rooms/${roomId}/events`)
        .then((r) => r.events),
    enabled: !!roomId,
  });
}

export function useEventDetail(roomId: string, eventId: string) {
  return useQuery({
    queryKey: queryKeys.myRooms.eventDetail(roomId, eventId),
    queryFn: () =>
      api
        .get<{ event: MobileEventDetail }>(`/api/mobile/my-rooms/${roomId}/events/${eventId}`)
        .then((r) => r.event),
    enabled: !!roomId && !!eventId,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roomId, data }: { roomId: string; data: Record<string, unknown> }) =>
      api.post<{ success: boolean; eventId: string }>(
        `/api/mobile/my-rooms/${roomId}/events`,
        data
      ),
    onSuccess: (_data, { roomId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myRooms.events(roomId) });
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      roomId,
      eventId,
      data,
    }: {
      roomId: string;
      eventId: string;
      data: Record<string, unknown>;
    }) => api.patch(`/api/mobile/my-rooms/${roomId}/events/${eventId}`, data),
    onSuccess: (_data, { roomId, eventId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myRooms.events(roomId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.myRooms.eventDetail(roomId, eventId) });
    },
  });
}

export function useCancelEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roomId, eventId }: { roomId: string; eventId: string }) =>
      api.post(`/api/mobile/my-rooms/${roomId}/events/${eventId}/cancel`),
    onSuccess: (_data, { roomId, eventId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myRooms.events(roomId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.myRooms.eventDetail(roomId, eventId) });
    },
  });
}

export function useBatchInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      roomId,
      eventId,
      applicationIds,
    }: {
      roomId: string;
      eventId: string;
      applicationIds: string[];
    }) =>
      api.post<{ success: boolean; count: number }>(
        `/api/mobile/my-rooms/${roomId}/events/${eventId}/invite`,
        { applicationIds }
      ),
    onSuccess: (_data, { roomId, eventId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myRooms.events(roomId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.myRooms.eventDetail(roomId, eventId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.myRooms.applicants(roomId) });
    },
  });
}

// ── Voting ─────────────────────────────────────────────────

export function useVotableApplicants(roomId: string) {
  return useQuery({
    queryKey: queryKeys.myRooms.votableApplicants(roomId),
    queryFn: () =>
      api
        .get<{
          applicants: MobileVotableApplicant[];
        }>(`/api/mobile/my-rooms/${roomId}/voting/applicants`)
        .then((r) => r.applicants),
    enabled: !!roomId,
  });
}

export function useVoteBoard(roomId: string) {
  return useQuery({
    queryKey: queryKeys.myRooms.voteBoard(roomId),
    queryFn: () =>
      api
        .get<{ board: MobileVoteBoard }>(`/api/mobile/my-rooms/${roomId}/voting/board`)
        .then((r) => r.board),
    enabled: !!roomId,
  });
}

export function useSubmitVotes() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      roomId,
      rankings,
      round,
    }: {
      roomId: string;
      rankings: { applicantId: string; rank: number }[];
      round?: number;
    }) => api.post(`/api/mobile/my-rooms/${roomId}/voting/submit`, { rankings, round }),
    onSuccess: (_data, { roomId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myRooms.voteBoard(roomId) });
    },
  });
}

// ── Close Room ─────────────────────────────────────────────

export function useCloseRoomApplicants(roomId: string) {
  return useQuery({
    queryKey: queryKeys.myRooms.closeApplicants(roomId),
    queryFn: () =>
      api
        .get<{
          applicants: MobileCloseRoomApplicant[];
        }>(`/api/mobile/my-rooms/${roomId}/close/applicants`)
        .then((r) => r.applicants),
    enabled: !!roomId,
  });
}

export function useCloseRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      roomId,
      chosenApplicationId,
    }: {
      roomId: string;
      chosenApplicationId?: string;
    }) => api.post(`/api/mobile/my-rooms/${roomId}/close`, { chosenApplicationId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myRooms.list() });
    },
  });
}
