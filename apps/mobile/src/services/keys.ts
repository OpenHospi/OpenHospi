export const queryKeys = {
  profile: {
    detail: () => ['profile'] as const,
  },
  rooms: {
    list: (filters: Record<string, unknown>) => ['rooms', 'list', filters] as const,
    detail: (id: string) => ['rooms', 'detail', id] as const,
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
  encryption: {
    backup: () => ['encryption', 'backup'] as const,
    status: () => ['encryption', 'status'] as const,
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
