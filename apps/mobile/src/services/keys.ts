export const queryKeys = {
  profile: {
    detail: () => ['profile'] as const,
  },
  rooms: {
    list: (filters: Record<string, unknown>) => ['rooms', 'list', filters] as const,
    detail: (id: string) => ['rooms', 'detail', id] as const,
  },
  myRooms: {
    list: () => ['myRooms'] as const,
    detail: (id: string) => ['myRooms', id] as const,
    houses: () => ['myRooms', 'houses'] as const,
    applicants: (roomId: string) => ['myRooms', roomId, 'applicants'] as const,
    events: (roomId: string) => ['myRooms', roomId, 'events'] as const,
    eventDetail: (roomId: string, eventId: string) =>
      ['myRooms', roomId, 'events', eventId] as const,
    votableApplicants: (roomId: string) => ['myRooms', roomId, 'votableApplicants'] as const,
    voteBoard: (roomId: string) => ['myRooms', roomId, 'voteBoard'] as const,
    closeApplicants: (roomId: string) => ['myRooms', roomId, 'closeApplicants'] as const,
  },
  applications: {
    list: () => ['applications'] as const,
    detail: (id: string) => ['applications', id] as const,
  },
  invitations: {
    list: () => ['invitations'] as const,
  },
  onboarding: {
    status: () => ['onboarding', 'status'] as const,
  },
  verification: {
    status: (peerUserId: string) => ['verification', 'status', peerUserId] as const,
    identityKeys: (userIds: string[]) => ['identity-keys', ...userIds] as const,
  },
  settings: {
    consent: () => ['settings', 'consent'] as const,
    sessions: () => ['settings', 'sessions'] as const,
  },
  chat: {
    conversations: () => ['chat', 'conversations'] as const,
    conversationDetail: (id: string) => ['chat', 'conversations', id] as const,
    messages: (conversationId: string) => ['chat', 'messages', conversationId] as const,
  },
};
