/* eslint-disable import/first -- react-native-quick-crypto polyfill must run before all other imports */
import { install } from 'react-native-quick-crypto';
install();

import { setCryptoProvider } from '@openhospi/crypto';
import { createNativeCryptoProvider } from '@openhospi/crypto/native';
setCryptoProvider(createNativeCryptoProvider());

import '../global.css';
import { hideSplash } from '@/lib/splash';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import * as Sentry from '@sentry/react-native';
import { ThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { isRunningInExpoGo } from 'expo';
import { Stack } from 'expo-router';
import React from 'react';
import { I18nextProvider } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useUniwind } from 'uniwind';

import { SessionProvider, useAppSession } from '@/context/session';
import { ToastProvider } from '@/context/toast';
import { useRunMigrations } from '@/lib/db/migrations';
import i18n, { i18nReady } from '@/i18n';
import { SENTRY_DSN } from '@/lib/constants';
import { queryClient, persistOptions } from '@/lib/query-client';
import { initializeNetworkManager } from '@/lib/network';
import { initializeAppLifecycle } from '@/lib/app-lifecycle';
import { initializeNotificationListeners } from '@/lib/notifications';
import { NAV_THEME } from '@/lib/theme';

// ── Sentry ──────────────────────────────────────────────────

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

// ── Error Boundary ────────────────────────────────────────��─

export function ErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
  Sentry.captureException(error);

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

// ── Foundation Initialization ───────────────────────────────
// Initialize network monitoring and app lifecycle management
// at module level so they start immediately.

initializeNetworkManager();
initializeAppLifecycle();
initializeNotificationListeners();

// ── Root Navigator ──────────────────────────────────────────

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

// ── Root Layout ─────────────────────────────────────────────

let RootLayout = function RootLayout() {
  const { theme } = useUniwind();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
        <I18nextProvider i18n={i18n}>
          <ThemeProvider value={NAV_THEME[(theme ?? 'light') as 'light' | 'dark']}>
            <BottomSheetModalProvider>
              <SessionProvider>
                <ToastProvider>
                  <RootNavigator />
                </ToastProvider>
              </SessionProvider>
            </BottomSheetModalProvider>
            <PortalHost />
          </ThemeProvider>
        </I18nextProvider>
      </PersistQueryClientProvider>
    </GestureHandlerRootView>
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
