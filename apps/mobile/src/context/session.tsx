import { createContext, useContext, useEffect } from 'react';
import { router } from 'expo-router';

import { useSession } from '@/lib/auth-client';
import { onSessionExpired } from '@/lib/api-client';
import { useOnboardingStatus } from '@/services/onboarding';
import type { OnboardingStatus } from '@openhospi/shared/api-types';

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

  // Listen for session-expired events from the 401 interceptor
  // in api-client.ts. When a session refresh fails after a 401,
  // navigate the user back to the login screen.
  useEffect(() => {
    return onSessionExpired(() => {
      router.replace('/(auth)/login');
    });
  }, []);

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
