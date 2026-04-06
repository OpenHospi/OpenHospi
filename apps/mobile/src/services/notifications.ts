import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { STALE_TIMES } from '@/lib/constants';

import { queryKeys } from './keys';

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  data: unknown;
  readAt: string | null;
  createdAt: string;
};

type NotificationsResponse = {
  notifications: NotificationItem[];
  unreadCount: number;
};

export function useNotifications() {
  return useInfiniteQuery({
    queryKey: queryKeys.notifications.list(),
    queryFn: ({ pageParam }) =>
      api.get<NotificationsResponse>(`/api/mobile/notifications?page=${pageParam}`),
    initialPageParam: 1,
    getNextPageParam: (lastPage, _allPages, lastPageParam) =>
      lastPage.notifications.length > 0 ? lastPageParam + 1 : undefined,
    staleTime: STALE_TIMES.notifications,
    // NOTE: Offset-based pagination has edge cases (skip/duplicate on delete).
    // Switch to cursor-based when the backend API supports it.
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: () => api.get<NotificationsResponse>('/api/mobile/notifications?page=1'),
    select: (data) => data.unreadCount,
    staleTime: STALE_TIMES.notifications,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) =>
      api.post(`/api/mobile/notifications/${notificationId}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount() });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.post('/api/mobile/notifications', { action: 'mark-all-read' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount() });
    },
  });
}
