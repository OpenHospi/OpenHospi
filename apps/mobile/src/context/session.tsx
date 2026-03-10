import { createContext, useContext } from 'react';

import { useSession } from '@/lib/auth-client';
import { useOnboardingStatus } from '@/services/onboarding';
import type { OnboardingStatus } from '@/services/types';

type SessionContextValue = {
  session: ReturnType<typeof useSession>['data'];
  onboardingStatus: OnboardingStatus | undefined;
  isLoading: boolean;
  isAuthenticated: boolean;
  needsOnboarding: boolean;
};

const SessionContext = createContext<SessionContextValue>({
  session: null,
  onboardingStatus: undefined,
  isLoading: true,
  isAuthenticated: false,
  needsOnboarding: false,
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const { data: session, isPending: sessionPending } = useSession();
  const { data: onboardingStatus, isPending: onboardingPending } = useOnboardingStatus({
    enabled: !!session,
  });

  const isLoading = sessionPending || (!!session && onboardingPending);
  const isAuthenticated = !!session && (onboardingStatus?.isComplete ?? false);
  const needsOnboarding = !!session && !(onboardingStatus?.isComplete ?? false);

  return (
    <SessionContext.Provider
      value={{ session, onboardingStatus, isLoading, isAuthenticated, needsOnboarding }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useAppSession() {
  return useContext(SessionContext);
}
