import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function ChatLayout() {
  const { t } = useTranslation('translation', { keyPrefix: 'app.chat' });

  return (
    <Stack>
      <Stack.Screen name="[conversationId]" options={{ title: '', headerBackVisible: true }} />
      <Stack.Screen name="[conversationId]/info" options={{ title: t('group_info') }} />
    </Stack>
  );
}
