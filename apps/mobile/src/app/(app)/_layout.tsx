import { Stack } from 'expo-router';

import { useTranslations } from '@/i18n';

export default function AppLayout() {
  const t = useTranslations('app.applications');
  const tSettings = useTranslations('app.settings');

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="room/[id]" options={{ title: '' }} />
      <Stack.Screen name="application/[id]" options={{ title: t('detailTitle') }} />
      <Stack.Screen name="settings" options={{ title: tSettings('title') }} />
    </Stack>
  );
}
