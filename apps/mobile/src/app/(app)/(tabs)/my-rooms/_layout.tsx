import Stack from 'expo-router/stack';
import { useTranslation } from 'react-i18next';

export default function MyRoomsTabLayout() {
  const { t } = useTranslation('translation', { keyPrefix: 'app.rooms' });

  return (
    <Stack
      screenOptions={{
        headerLargeTitle: true,
      }}>
      <Stack.Screen name="index" options={{ title: t('title') }} />
    </Stack>
  );
}
