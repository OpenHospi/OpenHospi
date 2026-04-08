import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api-client';
import { STALE_TIMES } from '@/lib/constants';
import { createMutationErrorHandler } from '@/lib/mutation-error';

import { queryKeys } from './keys';
import type {
  CloseRoomApplicant,
  EventDetail,
  EventSummary,
  MyRoomDetail,
  MyRoomSummary,
  OwnerHouse,
  RoomApplicant,
  RoomDetailPhoto,
  VotableApplicant,
  VoteBoard,
} from '@openhospi/shared/api-types';

// ── Typed Payloads ─────────────────────────────────────────

type SaveBasicInfoPayload = {
  title: string;
  city: string;
  neighborhood?: string;
  streetName?: string;
  houseNumber?: string;
  postalCode?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
};

type SaveDetailsPayload = {
  rentPrice?: number;
  deposit?: number;
  serviceCosts?: number;
  estimatedUtilitiesCosts?: number;
  utilitiesIncluded?: string;
  roomSizeM2?: number;
  rentalType?: string;
  houseType?: string;
  furnishing?: string;
  features?: string[];
  availableFrom?: string;
  availableUntil?: string;
  totalHousemates?: number;
};

type SavePreferencesPayload = {
  genderPreference?: string;
  preferredGender?: string;
  preferredAgeMin?: number;
  preferredAgeMax?: number;
  maxOccupancy?: number;
  locationTags?: string[];
  features?: string[];
  acceptedLanguages?: string[];
  roomVereniging?: string | null;
};

type UpdateRoomPayload = Partial<
  SaveBasicInfoPayload & SaveDetailsPayload & SavePreferencesPayload
>;

type ShareLinkSettingsPayload = {
  isActive?: boolean;
  shareLinkExpiresAt?: string | null;
  shareLinkMaxUses?: number | null;
};

type CreateEventPayload = {
  title: string;
  description?: string;
  eventDate?: string;
  startDate?: string;
  timeStart?: string;
  timeEnd?: string;
  endDate?: string;
  location?: string;
  maxAttendees?: number;
  notes?: string;
};

type UpdateEventPayload = Partial<CreateEventPayload>;

// ── Queries ─────────────────────────────────────────────────

export function useMyRooms() {
  return useQuery({
    queryKey: queryKeys.myRooms.list(),
    queryFn: () => api.get<{ rooms: MyRoomSummary[] }>('/api/mobile/my-rooms'),
    select: (data) => data.rooms,
    staleTime: STALE_TIMES.rooms,
  });
}

export function useMyRoom(id: string) {
  return useQuery({
    queryKey: queryKeys.myRooms.detail(id),
    queryFn: () => api.get<{ room: MyRoomDetail }>(`/api/mobile/my-rooms/${id}`),
    select: (data) => data.room,
    enabled: !!id,
    staleTime: STALE_TIMES.rooms,
  });
}

export function useOwnerHouses() {
  return useQuery({
    queryKey: queryKeys.myRooms.houses(),
    queryFn: () => api.get<{ houses: OwnerHouse[] }>('/api/mobile/my-rooms/houses'),
    select: (data) => data.houses,
    staleTime: STALE_TIMES.houses,
  });
}

// ── House + Draft Creation ──────────────────────────────────

export function useCreateHouse() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const onError = createMutationErrorHandler(showToast);
  return useMutation({
    mutationFn: (name: string) => api.post<{ id: string }>('/api/mobile/my-rooms/houses', { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myRooms.houses() });
    },
    onError,
  });
}

export function useCreateDraft() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const onError = createMutationErrorHandler(showToast);
  return useMutation({
    mutationFn: (houseId: string) =>
      api.post<{ id: string }>(`/api/mobile/my-rooms/houses/${houseId}/draft`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myRooms.list() });
    },
    onError,
  });
}

// ── Wizard Steps ────────────────────────────────────────────

export function useSaveBasicInfo() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const onError = createMutationErrorHandler(showToast);
  return useMutation({
    mutationFn: ({ roomId, data }: { roomId: string; data: SaveBasicInfoPayload }) =>
      api.patch(`/api/mobile/my-rooms/${roomId}/basic-info`, data),
    onSuccess: (_data, { roomId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myRooms.detail(roomId) });
    },
    onError,
  });
}

export function useSaveDetails() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const onError = createMutationErrorHandler(showToast);
  return useMutation({
    mutationFn: ({ roomId, data }: { roomId: string; data: SaveDetailsPayload }) =>
      api.patch(`/api/mobile/my-rooms/${roomId}/details`, data),
    onSuccess: (_data, { roomId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myRooms.detail(roomId) });
    },
    onError,
  });
}

export function useSavePreferences() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const onError = createMutationErrorHandler(showToast);
  return useMutation({
    mutationFn: ({ roomId, data }: { roomId: string; data: SavePreferencesPayload }) =>
      api.patch(`/api/mobile/my-rooms/${roomId}/preferences`, data),
    onSuccess: (_data, { roomId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myRooms.detail(roomId) });
    },
    onError,
  });
}

export function usePublishRoom() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const onError = createMutationErrorHandler(showToast);
  return useMutation({
    mutationFn: (roomId: string) => api.post(`/api/mobile/my-rooms/${roomId}/publish`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myRooms.list() });
    },
    onError,
  });
}

// ── Photo Management ────────────────────────────────────────

export function useUploadRoomPhoto() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const onError = createMutationErrorHandler(showToast);
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
    onError,
  });
}

export function useDeleteRoomPhoto() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const onError = createMutationErrorHandler(showToast);
  return useMutation({
    mutationFn: ({ roomId, slot }: { roomId: string; slot: number }) =>
      api.delete(`/api/mobile/my-rooms/${roomId}/photos/${slot}`),
    onSuccess: (_data, { roomId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myRooms.detail(roomId) });
    },
    onError,
  });
}

// ── Room Management ─────────────────────────────────────────

export function useUpdateRoom() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const onError = createMutationErrorHandler(showToast);
  return useMutation({
    mutationFn: ({ roomId, data }: { roomId: string; data: UpdateRoomPayload }) =>
      api.patch(`/api/mobile/my-rooms/${roomId}`, data),
    onSuccess: (_data, { roomId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myRooms.detail(roomId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.myRooms.list() });
    },
    onError,
  });
}

export function useUpdateRoomStatus() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const onError = createMutationErrorHandler(showToast);
  return useMutation({
    mutationFn: ({ roomId, status }: { roomId: string; status: string }) =>
      api.patch(`/api/mobile/my-rooms/${roomId}/status`, { status }),
    onSuccess: (_data, { roomId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myRooms.detail(roomId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.myRooms.list() });
    },
    onError,
  });
}

export function useDeleteRoom() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const onError = createMutationErrorHandler(showToast);
  return useMutation({
    mutationFn: (roomId: string) => api.delete(`/api/mobile/my-rooms/${roomId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myRooms.list() });
    },
    onError,
  });
}

export function useRegenerateShareLink() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const onError = createMutationErrorHandler(showToast);
  return useMutation({
    mutationFn: (roomId: string) =>
      api.post(`/api/mobile/my-rooms/${roomId}/share-link/regenerate`),
    onSuccess: (_data, roomId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myRooms.detail(roomId) });
    },
    onError,
  });
}

export function useUpdateShareLinkSettings() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const onError = createMutationErrorHandler(showToast);
  return useMutation({
    mutationFn: ({ roomId, data }: { roomId: string; data: ShareLinkSettingsPayload }) =>
      api.patch(`/api/mobile/my-rooms/${roomId}/share-link`, data),
    onSuccess: (_data, { roomId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myRooms.detail(roomId) });
    },
    onError,
  });
}

// ── Applicants ─────────────────────────────────────────────

export function useRoomApplicants(roomId: string) {
  return useQuery({
    queryKey: queryKeys.myRooms.applicants(roomId),
    queryFn: () =>
      api.get<{ applicants: RoomApplicant[] }>(`/api/mobile/my-rooms/${roomId}/applicants`),
    select: (data) => data.applicants,
    enabled: !!roomId,
    staleTime: STALE_TIMES.rooms,
  });
}

export function useMarkApplicationsSeen() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const onError = createMutationErrorHandler(showToast);
  return useMutation({
    mutationFn: (roomId: string) => api.post(`/api/mobile/my-rooms/${roomId}/applicants/mark-seen`),
    onSuccess: (_data, roomId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myRooms.applicants(roomId) });
    },
    onError,
  });
}

export function useSubmitReview() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const onError = createMutationErrorHandler(showToast);
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
    onError,
  });
}

export function useUpdateApplicantStatus() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const onError = createMutationErrorHandler(showToast);
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
    onError,
  });
}

// ── Events ─────────────────────────────────────────────────

export function useRoomEvents(roomId: string) {
  return useQuery({
    queryKey: queryKeys.myRooms.events(roomId),
    queryFn: () => api.get<{ events: EventSummary[] }>(`/api/mobile/my-rooms/${roomId}/events`),
    select: (data) => data.events,
    enabled: !!roomId,
    staleTime: STALE_TIMES.rooms,
  });
}

export function useEventDetail(roomId: string, eventId: string) {
  return useQuery({
    queryKey: queryKeys.myRooms.eventDetail(roomId, eventId),
    queryFn: () =>
      api.get<{ event: EventDetail }>(`/api/mobile/my-rooms/${roomId}/events/${eventId}`),
    select: (data) => data.event,
    enabled: !!roomId && !!eventId,
    staleTime: STALE_TIMES.rooms,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const onError = createMutationErrorHandler(showToast);
  return useMutation({
    mutationFn: ({ roomId, data }: { roomId: string; data: CreateEventPayload }) =>
      api.post<{ success: boolean; eventId: string }>(
        `/api/mobile/my-rooms/${roomId}/events`,
        data
      ),
    onSuccess: (_data, { roomId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myRooms.events(roomId) });
    },
    onError,
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const onError = createMutationErrorHandler(showToast);
  return useMutation({
    mutationFn: ({
      roomId,
      eventId,
      data,
    }: {
      roomId: string;
      eventId: string;
      data: UpdateEventPayload;
    }) => api.patch(`/api/mobile/my-rooms/${roomId}/events/${eventId}`, data),
    onSuccess: (_data, { roomId, eventId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myRooms.events(roomId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.myRooms.eventDetail(roomId, eventId) });
    },
    onError,
  });
}

export function useCancelEvent() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const onError = createMutationErrorHandler(showToast);
  return useMutation({
    mutationFn: ({ roomId, eventId }: { roomId: string; eventId: string }) =>
      api.post(`/api/mobile/my-rooms/${roomId}/events/${eventId}/cancel`),
    onSuccess: (_data, { roomId, eventId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myRooms.events(roomId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.myRooms.eventDetail(roomId, eventId) });
    },
    onError,
  });
}

export function useBatchInvite() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const onError = createMutationErrorHandler(showToast);
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
    onError,
  });
}

// ── Voting ─────────────────────────────────────────────────

export function useVotableApplicants(roomId: string) {
  return useQuery({
    queryKey: queryKeys.myRooms.votableApplicants(roomId),
    queryFn: () =>
      api.get<{ applicants: VotableApplicant[] }>(
        `/api/mobile/my-rooms/${roomId}/voting/applicants`
      ),
    select: (data) => data.applicants,
    enabled: !!roomId,
    staleTime: STALE_TIMES.rooms,
  });
}

export function useVoteBoard(roomId: string) {
  return useQuery({
    queryKey: queryKeys.myRooms.voteBoard(roomId),
    queryFn: () => api.get<{ board: VoteBoard }>(`/api/mobile/my-rooms/${roomId}/voting/board`),
    select: (data) => data.board,
    enabled: !!roomId,
    staleTime: STALE_TIMES.rooms,
  });
}

export function useSubmitVotes() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const onError = createMutationErrorHandler(showToast);
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
    onError,
  });
}

// ── Close Room ─────────────────────────────────────────────

export function useCloseRoomApplicants(roomId: string) {
  return useQuery({
    queryKey: queryKeys.myRooms.closeApplicants(roomId),
    queryFn: () =>
      api.get<{ applicants: CloseRoomApplicant[] }>(
        `/api/mobile/my-rooms/${roomId}/close/applicants`
      ),
    select: (data) => data.applicants,
    enabled: !!roomId,
    staleTime: STALE_TIMES.rooms,
  });
}

export function useCloseRoom() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const onError = createMutationErrorHandler(showToast);
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
    onError,
  });
}
