export type ActiveConsent = {
  userId: string;
  purpose: string;
  granted: boolean;
  lastUpdatedAt: string;
};

export type SessionInfo = {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
  expiresAt: string;
  isCurrent: boolean;
};
