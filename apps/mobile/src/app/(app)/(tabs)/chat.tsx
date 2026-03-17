import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Text } from '@/components/ui/text';

export default function ChatTab() {
  const { t } = useTranslation('translation', { keyPrefix: 'app.chat' });

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <Text className="text-muted-foreground text-center text-sm">{t('title')}</Text>
    </View>
  );
}
