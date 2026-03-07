// Crypto polyfill must be imported before anything that uses crypto.subtle
import '@/lib/crypto-polyfill';
import '@/global.css';

import { ThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { QueryClientProvider } from '@tanstack/react-query';
import { useRouter, useSegments, Stack } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, Text, View, useColorScheme } from 'react-native';

import { useRunMigrations } from '@/db/migrations';
import { I18nProvider } from '@/i18n';
import { useSession } from '@/lib/auth-client';
import { queryClient } from '@/lib/query-client';
import { initSentry, Sentry } from '@/lib/sentry';
import { NAV_THEME } from '@/lib/theme';
import { useOnboardingStatus } from '@/services/onboarding';

// Initialize Sentry before rendering
initSentry();

function MigrationGate({ children }: { children: React.ReactNode }) {
  const { success, error } = useRunMigrations();

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Database migration failed: {error.message}</Text>
      </View>
    );
  }

  if (!success) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <>{children}</>;
}

function OnboardingGuard() {
  const { data: session, isPending: sessionPending } = useSession();
  const { data: onboardingStatus, isPending: onboardingPending } = useOnboardingStatus();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (sessionPending) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = inAuthGroup && (segments as string[])[1] === 'onboarding';

    if (!session) {
      if (!inAuthGroup) {
        router.replace('/(auth)/login');
      }
      return;
    }

    // Session exists — check onboarding
    if (onboardingPending) return;

    if (onboardingStatus && !onboardingStatus.isComplete) {
      if (!inOnboarding) {
        router.replace('/(auth)/onboarding' as never);
      }
      return;
    }

    // Complete — go to app
    if (inAuthGroup) {
      router.replace('/(app)/(tabs)/discover');
    }
  }, [session, sessionPending, onboardingStatus, onboardingPending, segments, router]);

  if (sessionPending || (session && onboardingPending)) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return null;
}

function RootNavigator() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <>
      <OnboardingGuard />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={!!session}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
        <Stack.Protected guard={!session}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Screen name="+not-found" />
      </Stack>
    </>
  );
}

let RootLayout = function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? 'dark' : 'light';

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <ThemeProvider value={NAV_THEME[theme]}>
          <MigrationGate>
            <RootNavigator />
          </MigrationGate>
          <PortalHost />
        </ThemeProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
};

// Drizzle Studio dev plugin
if (__DEV__) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useDrizzleStudio } = require('expo-drizzle-studio-plugin');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { db } = require('@/db/client');
    const OriginalRootLayout = RootLayout;
    // eslint-disable-next-line react/display-name
    RootLayout = function () {
      useDrizzleStudio(db);
      return <OriginalRootLayout />;
    };
  } catch {
    // expo-drizzle-studio-plugin not available
  }
}

export default Sentry.wrap(RootLayout);
