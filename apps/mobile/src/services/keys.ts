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
  settings: {
    consent: () => ['settings', 'consent'] as const,
    sessions: () => ['settings', 'sessions'] as const,
  },
};
