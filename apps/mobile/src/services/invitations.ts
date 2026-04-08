import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { createMutationErrorHandler } from '@/lib/mutation-error';
import { useToast } from '@/hooks/use-toast';

import { queryKeys } from './keys';
import type { UserInvitation } from '@openhospi/shared/api-types';

export function useInvitations() {
  return useQuery({
    queryKey: queryKeys.invitations.list(),
    queryFn: () => api.get<UserInvitation[]>('/api/mobile/invitations'),
  });
}

export function useRespondToInvitation() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const onError = createMutationErrorHandler(showToast);

  return useMutation({
    mutationFn: ({
      invitationId,
      data,
    }: {
      invitationId: string;
      applicationId?: string;
      data: { status: string; declineReason?: string };
    }) => api.post(`/api/mobile/invitations/${invitationId}/rsvp`, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invitations.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.applications.list() });
      if (variables.applicationId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.applications.detail(variables.applicationId),
          exact: true,
        });
      }
    },
    onError,
  });
}
