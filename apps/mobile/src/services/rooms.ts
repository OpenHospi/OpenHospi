import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { queryKeys } from './keys';
import type { DiscoverFilters, DiscoverResult, RoomDetailResponse } from './types';

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

export function useApplyToRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roomId, data }: { roomId: string; data: { personalMessage: string } }) =>
      api.post(`/api/mobile/rooms/${roomId}/apply`, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms.detail(variables.roomId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.applications.list() });
    },
  });
}
