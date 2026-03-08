import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { queryKeys } from './keys';
import type { UserInvitation } from './types';

export function useInvitations() {
  return useQuery({
    queryKey: queryKeys.invitations.list(),
    queryFn: () => api.get<UserInvitation[]>('/api/mobile/invitations'),
  });
}

export function useRespondToInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      invitationId,
      data,
    }: {
      invitationId: string;
      data: { status: string; declineReason?: string };
    }) => api.post(`/api/mobile/invitations/${invitationId}/rsvp`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invitations.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.applications.list() });
    },
  });
}
