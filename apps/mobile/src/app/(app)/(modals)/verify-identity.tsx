import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

export default function VerifyIdentityScreen() {
  const { t } = useTranslation('translation', { keyPrefix: 'app.chat.safety_number' });
  const router = useRouter();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 16 }}>
      <Text className="text-foreground font-semibold">{t('title')}</Text>
      <Text variant="muted" className="text-center text-sm">
        {t('description', { name: '' })}
      </Text>
      <Button variant="outline" onPress={() => router.back()}>
        <Text className="text-foreground">{t('close')}</Text>
      </Button>
    </View>
  );
}
