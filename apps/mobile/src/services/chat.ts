import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { queryKeys } from '@/services/keys';

export type ConversationListItem = {
  id: string;
  type: string;
  roomTitle: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  members: { userId: string; firstName: string; lastName: string; avatarUrl: string | null }[];
};

export type ConversationDetail = {
  id: string;
  roomId: string | null;
  seekerUserId: string | null;
  type: string;
  room: {
    id: string;
    title: string;
    city: string;
    rentPrice: string;
    coverPhotoUrl: string | null;
  } | null;
  members: {
    userId: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
    role: 'seeker' | 'house_member';
  }[];
};

export type MessageItem = {
  id: string;
  senderId: string;
  senderFirstName: string;
  senderAvatarUrl: string | null;
  ciphertext: string | null;
  signature: string | null;
  senderKeyId: number | null;
  iteration: number | null;
  senderDeviceId: string | null;
  messageType: string;
  createdAt: string;
};

export function fetchConversationDetail(id: string) {
  return api.get<ConversationDetail>(`/api/mobile/chat/conversations/${id}`);
}

export function fetchMessages(conversationId: string, cursor?: string) {
  const params = cursor ? `?cursor=${cursor}` : '';
  return api.get<MessageItem[]>(
    `/api/mobile/chat/conversations/${conversationId}/messages${params}`
  );
}

export function fetchRealtimeToken() {
  return api.get<{ token: string }>('/api/mobile/chat/realtime-token');
}

function fetchConversations() {
  return api.get<ConversationListItem[]>('/api/mobile/chat/conversations');
}

function sendMessageApi(conversationId: string, payload: string) {
  return api.post<{ messageId: string }>('/api/mobile/chat/send', { conversationId, payload });
}

function markReadApi(conversationId: string) {
  return api.post(`/api/mobile/chat/conversations/${conversationId}/read`);
}

export function useConversations() {
  return useQuery({
    queryKey: queryKeys.chat.conversations(),
    queryFn: fetchConversations,
  });
}

export function useConversationDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.chat.conversationDetail(id),
    queryFn: () => fetchConversationDetail(id),
    enabled: !!id,
  });
}

export function useMessages(conversationId: string) {
  return useQuery({
    queryKey: queryKeys.chat.messages(conversationId),
    queryFn: () => fetchMessages(conversationId),
    enabled: !!conversationId,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, payload }: { conversationId: string; payload: string }) =>
      sendMessageApi(conversationId, payload),
    onSuccess: (_, { conversationId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.messages(conversationId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.conversations() });
    },
  });
}

export function useMarkRead(conversationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => markReadApi(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.conversations() });
    },
  });
}
