import Stack from 'expo-router/stack';
import { useTranslation } from 'react-i18next';

export default function MyRoomsLayout() {
  const { t } = useTranslation('translation', { keyPrefix: 'app.rooms' });

  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: t('title') }} />
      <Stack.Screen name="create/house-gate" options={{ title: t('createNew') }} />
      <Stack.Screen name="create/basic-info" options={{ title: t('wizard.steps.basicInfo') }} />
      <Stack.Screen name="create/details" options={{ title: t('wizard.steps.details') }} />
      <Stack.Screen name="create/preferences" options={{ title: t('wizard.steps.preferences') }} />
      <Stack.Screen name="create/photos" options={{ title: t('wizard.steps.photos') }} />
      <Stack.Screen name="create/review" options={{ title: t('actions.publish') }} />
      <Stack.Screen name="[id]/index" options={{ title: t('manage.details') }} />
      <Stack.Screen name="[id]/edit" options={{ title: t('actions.edit') }} />
      <Stack.Screen name="[id]/share-link" options={{ title: t('shareLink.title') }} />
    </Stack>
  );
}
