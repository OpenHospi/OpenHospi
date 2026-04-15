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

export type ConsentHistoryRecord = {
  id: string;
  purpose: string;
  granted: boolean;
  createdAt: string;
};

export type ProcessingRestrictionInfo = {
  userId: string;
  reason: string | null;
  restrictedAt: string;
  liftedAt: string | null;
  liftedBy: string | null;
} | null;

export type CalendarTokenInfo = {
  token: string | null;
};
