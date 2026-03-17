/* eslint-disable import/first -- react-native-quick-crypto polyfill must run before all other imports */
import { install } from 'react-native-quick-crypto';
install();

import '../global.css';
import { hideSplash } from '@/lib/splash';

import * as Sentry from '@sentry/react-native';
import { ThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { QueryClientProvider } from '@tanstack/react-query';
import { isRunningInExpoGo } from 'expo';
import { Stack } from 'expo-router';
import React from 'react';
import { I18nextProvider } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { useUniwind } from 'uniwind';

import { SessionProvider, useAppSession } from '@/context/session';
import { useRunMigrations } from '@/lib/db/migrations';
import i18n, { i18nReady } from '@/i18n';
import { SENTRY_DSN } from '@/lib/constants';
import { queryClient } from '@/lib/query-client';
import { NAV_THEME } from '@/lib/theme';

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

function RootNavigator() {
  const [i18nLoaded, setI18nLoaded] = React.useState(false);
  const { success: migrationsSuccess, error: migrationsError } = useRunMigrations();
  const { isLoading, isAuthenticated, needsOnboarding } = useAppSession();

  React.useEffect(() => {
    i18nReady.then(() => setI18nLoaded(true));
  }, []);

  const allReady = i18nLoaded && migrationsSuccess && !isLoading;

  React.useEffect(() => {
    if (allReady) {
      hideSplash();
    }
  }, [allReady]);

  if (migrationsError) {
    hideSplash();
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Database migration failed: {migrationsError.message}</Text>
      </View>
    );
  }

  if (!allReady) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={isAuthenticated}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={needsOnboarding}>
        <Stack.Screen name="(onboarding)" />
      </Stack.Protected>
      <Stack.Protected guard={!isAuthenticated && !needsOnboarding}>
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
      <I18nextProvider i18n={i18n}>
        <ThemeProvider value={NAV_THEME[(theme ?? 'light') as 'light' | 'dark']}>
          <SessionProvider>
            <RootNavigator />
          </SessionProvider>
          <PortalHost />
        </ThemeProvider>
      </I18nextProvider>
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
