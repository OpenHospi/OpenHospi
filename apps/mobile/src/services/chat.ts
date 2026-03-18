import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { queryKeys } from './keys';

// ── Types ──

type ConversationSummary = {
  id: string;
  roomId: string;
  roomTitle: string;
  seekerUserId: string;
  createdAt: string;
  unreadCount: number;
  lastMessageAt: string;
  members: { userId: string; firstName: string }[];
  roomPhotoUrl: string | null;
};

type ConversationDetail = {
  id: string;
  roomId: string;
  roomTitle: string;
  seekerUserId: string;
  createdAt: string;
  members: { userId: string; firstName: string }[];
};

type MessageRow = {
  id: string;
  conversationId: string;
  senderId: string;
  senderDeviceId: string | null;
  messageType: string;
  createdAt: string;
  payload: string | null;
  senderFirstName: string | null;
};

type MessagesPage = {
  messages: MessageRow[];
  nextCursor: string | null;
};

// ── Hooks ──

export function useConversations() {
  return useQuery({
    queryKey: queryKeys.chat.conversations(),
    queryFn: () => api.get<ConversationSummary[]>('/api/mobile/chat/conversations'),
  });
}

export function useConversationDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.chat.conversationDetail(id),
    queryFn: () => api.get<ConversationDetail>(`/api/mobile/chat/conversations/${id}`),
    enabled: !!id,
  });
}

export function useMessages(conversationId: string) {
  return useInfiniteQuery({
    queryKey: queryKeys.chat.messages(conversationId),
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams();
      if (pageParam) params.set('cursor', pageParam);
      const qs = params.toString();
      return api.get<MessagesPage>(
        `/api/mobile/chat/conversations/${conversationId}/messages${qs ? `?${qs}` : ''}`
      );
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!conversationId,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      conversationId: string;
      payload: string;
      deviceId?: string;
      distributions?: Array<{ recipientDeviceId: string; ciphertext: string }>;
    }) => api.post<MessageRow>('/api/mobile/chat/send', data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.chat.messages(variables.conversationId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.chat.conversations(),
      });
    },
  });
}

export function useMarkConversationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) =>
      api.post(`/api/mobile/chat/conversations/${conversationId}/read`),
    onSuccess: (_data, conversationId) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.chat.conversationDetail(conversationId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.chat.conversations(),
      });
    },
  });
}

export function useOpenConversation() {
  return useMutation({
    mutationFn: (data: { roomId: string; seekerUserId: string; memberUserIds: string[] }) =>
      api.post<{ id: string }>('/api/mobile/chat/conversations/open', data),
  });
}
