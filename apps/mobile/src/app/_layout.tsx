/* eslint-disable import/first -- react-native-quick-crypto polyfill must run before all other imports */
import { install } from 'react-native-quick-crypto';
install();

import { setCryptoProvider } from '@openhospi/crypto';
import { createNativeCryptoProvider } from '@openhospi/crypto/native';
setCryptoProvider(createNativeCryptoProvider());

import { hideSplash } from '@/lib/splash';

import * as Sentry from '@sentry/react-native';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { isRunningInExpoGo } from 'expo';
import { Stack, useNavigationContainerRef } from 'expo-router';
import React from 'react';
import { I18nextProvider } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ThemeProvider } from '@/design';
import { SessionProvider, useAppSession } from '@/context/session';
import { ToastProvider } from '@/context/toast';
import { useRunMigrations } from '@/lib/db/migrations';
import i18n, { i18nReady } from '@/i18n';
import { queryClient, persistOptions } from '@/lib/query-client';
import { initializeNetworkManager } from '@/lib/network';
import { initializeAppLifecycle } from '@/lib/app-lifecycle';
import { initializeNotificationListeners } from '@/lib/notifications';

// ── Sentry ──────────────────────────────────────────────────

const navigationIntegration = Sentry.reactNavigationIntegration({
  enableTimeToInitialDisplay: !isRunningInExpoGo(),
  ignoreEmptyBackNavigationTransactions: true,
});

Sentry.init({
  dsn: 'https://a93aab45c6f5e6cc68cacf09fa300ff7@o4511172188438528.ingest.de.sentry.io/4511172379934800',
  enabled: !__DEV__,
  sendDefaultPii: false,
  environment: __DEV__ ? 'development' : 'production',

  // Performance: navigation tracing with Expo Router
  tracesSampleRate: 0.2,
  integrations: [navigationIntegration],

  // Privacy: no screenshots, no view hierarchy, no session replay, no user tracking
  attachScreenshot: false,
  attachViewHierarchy: false,
});

// ── Error Boundary ────────────────────────────────────────��─

export function ErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
  Sentry.captureException(error);

  return (
    <View style={errorStyles.container}>
      <Text style={errorStyles.title}>Something went wrong</Text>
      <Text style={errorStyles.message}>{error.message}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Try Again" onPress={retry}>
        <Text style={errorStyles.retry}>Try Again</Text>
      </Pressable>
    </View>
  );
}

const errorStyles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 10, color: '#134e4a' },
  message: { fontSize: 14, textAlign: 'center', marginBottom: 20, color: '#5f8a86' },
  retry: { fontSize: 16, color: '#0d9488' },
});

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
  const ref = useNavigationContainerRef();

  React.useEffect(() => {
    if (ref) {
      navigationIntegration.registerNavigationContainer(ref);
    }
  }, [ref]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
          <I18nextProvider i18n={i18n}>
            <SessionProvider>
              <ToastProvider>
                <RootNavigator />
              </ToastProvider>
            </SessionProvider>
          </I18nextProvider>
        </PersistQueryClientProvider>
      </ThemeProvider>
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
