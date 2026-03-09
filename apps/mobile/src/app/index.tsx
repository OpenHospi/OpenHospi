import { Redirect } from 'expo-router';

import { useSession } from '@/lib/auth-client';
import { useOnboardingStatus } from '@/services/onboarding';

export default function Index() {
  const { data: session, isPending: sessionPending } = useSession();
  const { data: onboardingStatus, isPending: onboardingPending } = useOnboardingStatus();

  // RootNavigator shows loading while pending — this is a safety fallback
  if (sessionPending || (session && onboardingPending)) {
    return null;
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!onboardingStatus?.isComplete) {
    return <Redirect href="/(auth)/onboarding" />;
  }

  return <Redirect href="/(app)/(tabs)/discover" />;
}
