import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

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
  iv: string | null;
  ratchetPublicKey: string | null;
  messageNumber: number | null;
  previousChainLength: number | null;
  messageType: string;
  createdAt: string;
};

export type CiphertextPayload = {
  recipientUserId: string;
  ciphertext: string;
  iv: string;
  ratchetPublicKey: string;
  messageNumber: number;
  previousChainLength: number;
};

export const chatKeys = {
  conversations: () => ['chat', 'conversations'] as const,
  conversationDetail: (id: string) => ['chat', 'conversations', id] as const,
  messages: (conversationId: string) => ['chat', 'messages', conversationId] as const,
};

export function fetchConversationDetail(id: string) {
  return api.get<ConversationDetail>(`/chat/conversations/${id}`);
}

export function fetchMessages(conversationId: string, cursor?: string) {
  const params = cursor ? `?cursor=${cursor}` : '';
  return api.get<MessageItem[]>(`/chat/conversations/${conversationId}/messages${params}`);
}

export function fetchRealtimeToken() {
  return api.get<{ token: string }>('/chat/realtime-token');
}

function fetchConversations() {
  return api.get<ConversationListItem[]>('/chat/conversations');
}

function sendMessageApi(conversationId: string, payloads: CiphertextPayload[]) {
  return api.post<{ messageId: string }>('/chat/send', { conversationId, payloads });
}

function markReadApi(conversationId: string) {
  return api.post(`/chat/conversations/${conversationId}/read`);
}

export function useConversations() {
  return useQuery({
    queryKey: chatKeys.conversations(),
    queryFn: fetchConversations,
  });
}

export function useConversationDetail(id: string) {
  return useQuery({
    queryKey: chatKeys.conversationDetail(id),
    queryFn: () => fetchConversationDetail(id),
    enabled: !!id,
  });
}

export function useMessages(conversationId: string) {
  return useQuery({
    queryKey: chatKeys.messages(conversationId),
    queryFn: () => fetchMessages(conversationId),
    enabled: !!conversationId,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      conversationId,
      payloads,
    }: {
      conversationId: string;
      payloads: CiphertextPayload[];
    }) => sendMessageApi(conversationId, payloads),
    onSuccess: (_, { conversationId }) => {
      queryClient.invalidateQueries({ queryKey: chatKeys.messages(conversationId) });
      queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });
    },
  });
}

export function useMarkRead(conversationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => markReadApi(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });
    },
  });
}
