import { Stack } from 'expo-router';

import { useTranslation } from 'react-i18next';

export default function AppLayout() {
  const { t } = useTranslation('translation', { keyPrefix: 'app.applications' });
  const { t: tSettings } = useTranslation('translation', { keyPrefix: 'app.settings' });

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="room/[id]" options={{ title: '' }} />
      <Stack.Screen name="application/[id]" options={{ title: t('detailTitle') }} />
      <Stack.Screen name="settings" options={{ title: tSettings('title') }} />
    </Stack>
  );
}
