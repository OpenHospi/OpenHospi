import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { STALE_TIMES } from '@/lib/constants';

import type {
  ConversationDetail,
  ConversationSummary,
  MessageRow,
  MessagesPage,
} from '@openhospi/shared/api-types';

import { queryKeys } from './keys';

// ── Queries ─────────────────────────────────────────────────

export function useConversations() {
  return useQuery({
    queryKey: queryKeys.chat.conversations(),
    queryFn: () => api.get<ConversationSummary[]>('/api/mobile/chat/conversations'),
    staleTime: STALE_TIMES.chat,
  });
}

export function useConversationDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.chat.conversationDetail(id),
    queryFn: () => api.get<ConversationDetail>(`/api/mobile/chat/conversations/${id}`),
    enabled: !!id,
    staleTime: STALE_TIMES.chat,
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

// ── Send Message (Optimistic + Offline Queue) ───────────────

type SendMessageInput = {
  conversationId: string;
  payload: string;
  deviceId?: string;
  distributions?: { recipientDeviceId: string; ciphertext: string }[];
};

type OptimisticContext = {
  previousMessages: ReturnType<typeof useQueryClient> extends { getQueryData: infer G } ? G : never;
  optimisticId: string;
};

export function useSendMessage(currentUserId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    // mutationKey enables offline persistence for this mutation
    // (encrypted payloads only — never plaintext in AsyncStorage)
    mutationKey: ['sendMessage'],

    mutationFn: (data: SendMessageInput) => api.post<MessageRow>('/api/mobile/chat/send', data),

    onMutate: async (variables) => {
      const messagesKey = queryKeys.chat.messages(variables.conversationId);

      // Cancel in-flight refetches so optimistic update isn't overwritten
      await queryClient.cancelQueries({ queryKey: messagesKey });

      const previousMessages = queryClient.getQueryData(messagesKey);
      const optimisticId = crypto.randomUUID();

      // Insert optimistic message at the start of the first page
      queryClient.setQueryData<{ pages: MessagesPage[]; pageParams: unknown[] }>(
        messagesKey,
        (old) => {
          if (!old) return old;

          const optimisticMessage: MessageRow = {
            id: optimisticId,
            conversationId: variables.conversationId,
            senderId: currentUserId ?? '',
            senderDeviceId: variables.deviceId ?? null,
            messageType: 'ciphertext',
            createdAt: new Date().toISOString(),
            payload: variables.payload,
            senderFirstName: null,
          };

          const firstPage = old.pages[0];
          if (!firstPage) return old;

          return {
            ...old,
            pages: [
              { ...firstPage, messages: [optimisticMessage, ...firstPage.messages] },
              ...old.pages.slice(1),
            ],
          };
        }
      );

      return { previousMessages, optimisticId } as OptimisticContext;
    },

    onError: (_error, variables, context) => {
      // Rollback: restore previous messages
      if (context?.previousMessages) {
        queryClient.setQueryData(
          queryKeys.chat.messages(variables.conversationId),
          context.previousMessages
        );
      }
    },

    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.chat.messages(variables.conversationId),
      });
      // Only invalidate this specific conversation, not the entire list
      queryClient.invalidateQueries({
        queryKey: queryKeys.chat.conversationDetail(variables.conversationId),
        exact: true,
      });
    },
  });
}

// ── Other Mutations ─────────────────────────────────────────

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
