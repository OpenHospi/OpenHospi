/* eslint-disable import/first -- react-native-quick-crypto polyfill must run before all other imports */
import { install } from 'react-native-quick-crypto';
install();

import '../global.css';

import * as Sentry from '@sentry/react-native';
import { ThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { QueryClientProvider } from '@tanstack/react-query';
import { isRunningInExpoGo } from 'expo';
import { Stack } from 'expo-router';
import React from 'react';
import { I18nextProvider } from 'react-i18next';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useUniwind } from 'uniwind';

import { useRunMigrations } from '@/db/migrations';
import i18n, { i18nReady } from '@/i18n';
import { useSession } from '@/lib/auth-client';
import { SENTRY_DSN } from '@/lib/constants';
import { queryClient } from '@/lib/query-client';
import { NAV_THEME } from '@/lib/theme';
import { useOnboardingStatus } from '@/services/onboarding';

Sentry.init({
  dsn: SENTRY_DSN,
  sendDefaultPii: false,
  enableAutoSessionTracking: true,
  tracesSampleRate: 0.2,
  attachScreenshot: false,
  attachViewHierarchy: false,
  enabled: !__DEV__,
  enableNativeFramesTracking: !isRunningInExpoGo(),
});

export function ErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <View
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}
      className="bg-background">
      <Text className="text-foreground mb-2.5 text-lg font-bold">Something went wrong</Text>
      <Text className="text-muted-foreground mb-5 text-center text-sm">{error.message}</Text>
      <Pressable onPress={retry}>
        <Text className="text-primary text-base">Try Again</Text>
      </Pressable>
    </View>
  );
}

function I18nGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    i18nReady.then(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <>{children}</>;
}

function MigrationGate({ children }: { children: React.ReactNode }) {
  const { success, error } = useRunMigrations();

  if (error) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Database migration failed: {error.message}</Text>
      </View>
    );
  }

  if (!success) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  return <>{children}</>;
}

function RootNavigator() {
  const { data: session, isPending: sessionPending } = useSession();
  const { data: onboardingStatus, isPending: onboardingPending } = useOnboardingStatus();

  if (sessionPending || (session && onboardingPending)) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const isReady = !!session && (onboardingStatus?.isComplete ?? false);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Protected guard={isReady}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!isReady}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

let RootLayout = function RootLayout() {
  const { theme } = useUniwind();

  return (
    <QueryClientProvider client={queryClient}>
      <I18nGate>
        <I18nextProvider i18n={i18n}>
          <ThemeProvider value={NAV_THEME[(theme ?? 'light') as 'light' | 'dark']}>
            <MigrationGate>
              <RootNavigator />
            </MigrationGate>
            <PortalHost />
          </ThemeProvider>
        </I18nextProvider>
      </I18nGate>
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
