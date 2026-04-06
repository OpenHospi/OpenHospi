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
  nextCursor: string | null;
};

export function useNotifications() {
  return useInfiniteQuery({
    queryKey: queryKeys.notifications.list(),
    queryFn: ({ pageParam }) =>
      api.get<NotificationsResponse>(
        `/api/mobile/notifications${pageParam ? `?cursor=${pageParam}` : ''}`
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: STALE_TIMES.notifications,
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: () => api.get<NotificationsResponse>('/api/mobile/notifications'),
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
