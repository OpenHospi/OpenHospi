import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

export default function KeyRecoveryScreen() {
  const { t } = useTranslation('translation', { keyPrefix: 'app.onboarding.security' });
  const router = useRouter();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 16 }}>
      <Text className="text-foreground font-semibold">{t('e2ee_title')}</Text>
      <Text variant="muted" className="text-center text-sm">
        {t('e2ee_description')}
      </Text>
      <Button onPress={() => router.back()}>
        <Text>{t('use_pin')}</Text>
      </Button>
    </View>
  );
}
