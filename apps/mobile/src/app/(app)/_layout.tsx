import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { ConnectionStatusBar } from '@/components/feedback/connection-status-bar';
import { DiscoverFiltersProvider } from '@/context/discover-filters';

export default function AppLayout() {
  const { t } = useTranslation('translation', { keyPrefix: 'app.applications' });
  const { t: tBreadcrumbs } = useTranslation('translation', { keyPrefix: 'breadcrumbs' });
  const { t: tSettings } = useTranslation('translation', { keyPrefix: 'app.settings' });

  return (
    <DiscoverFiltersProvider>
      <View style={{ flex: 1 }}>
        <ConnectionStatusBar />
        <Stack>
          <Stack.Screen
            name="(tabs)"
            options={{ headerShown: false, title: tBreadcrumbs('discover') }}
          />
          <Stack.Screen name="(modals)" options={{ headerShown: false }} />
          <Stack.Screen name="room/[id]" options={{ title: '', animation: 'slide_from_right' }} />
          <Stack.Screen
            name="application/[id]"
            options={{ title: t('detailTitle'), animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="settings"
            options={{ title: tSettings('title'), animation: 'slide_from_right' }}
          />
          <Stack.Screen name="my-house" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="join/[code]" options={{ animation: 'slide_from_right' }} />
        </Stack>
      </View>
    </DiscoverFiltersProvider>
  );
}
