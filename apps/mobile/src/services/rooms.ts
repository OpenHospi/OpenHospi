import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, NetworkError } from '@/lib/api-client';
import { getNetworkStatus } from '@/lib/network';
import { ApplicationStatus } from '@openhospi/shared/enums';

import { queryKeys } from './keys';
import type {
  DiscoverFilters,
  DiscoverResult,
  RoomDetailResponse,
} from '@openhospi/shared/api-types';

// ── Helpers ─────────────────────────────────────────────────

function buildRoomQueryString(
  filters: DiscoverFilters,
  cursor?: { createdAt: string; id: string }
): string {
  const params = new URLSearchParams();
  if (filters.city) params.set('city', filters.city);
  if (filters.minPrice != null) params.set('minPrice', String(filters.minPrice));
  if (filters.maxPrice != null) params.set('maxPrice', String(filters.maxPrice));
  if (filters.houseType) params.set('houseType', filters.houseType);
  if (filters.furnishing) params.set('furnishing', filters.furnishing);
  if (filters.availableFrom) params.set('availableFrom', filters.availableFrom);
  if (filters.features?.length) params.set('features', filters.features.join(','));
  if (filters.locationTags?.length) params.set('locationTags', filters.locationTags.join(','));
  if (filters.sort) params.set('sort', filters.sort);
  if (cursor) {
    params.set('cursorCreatedAt', cursor.createdAt);
    params.set('cursorId', cursor.id);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

// ── Queries ─────────────────────────────────────────────────

export function useRooms(filters: DiscoverFilters) {
  return useInfiniteQuery({
    queryKey: queryKeys.rooms.list(filters),
    queryFn: ({ pageParam }) =>
      api.get<DiscoverResult>(
        `/api/mobile/rooms${buildRoomQueryString(filters, pageParam as { createdAt: string; id: string } | undefined)}`
      ),
    initialPageParam: undefined as { createdAt: string; id: string } | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

export function useRoom(id: string) {
  return useQuery({
    queryKey: queryKeys.rooms.detail(id),
    queryFn: () => api.get<RoomDetailResponse>(`/api/mobile/rooms/${id}`),
    enabled: !!id,
  });
}

// ── Apply to Room (Optimistic) ──────────────────────────────

export function useApplyToRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roomId, data }: { roomId: string; data: { personalMessage: string } }) => {
      // Guard: non-queued mutations fail fast when offline
      const { isOnline } = getNetworkStatus();
      if (!isOnline) {
        throw new NetworkError();
      }
      return api.post(`/api/mobile/rooms/${roomId}/apply`, data);
    },

    onMutate: async (variables) => {
      const detailKey = queryKeys.rooms.detail(variables.roomId);

      await queryClient.cancelQueries({ queryKey: detailKey });

      const previousDetail = queryClient.getQueryData<RoomDetailResponse>(detailKey);

      // Optimistically set application to sent
      if (previousDetail) {
        queryClient.setQueryData<RoomDetailResponse>(detailKey, {
          ...previousDetail,
          application: {
            id: 'optimistic',
            status: ApplicationStatus.sent,
          },
        });
      }

      return { previousDetail };
    },

    onError: (_error, variables, context) => {
      // Rollback on failure
      if (context?.previousDetail) {
        queryClient.setQueryData(queryKeys.rooms.detail(variables.roomId), context.previousDetail);
      }
    },

    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms.detail(variables.roomId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.applications.list() });
    },
  });
}
