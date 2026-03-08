import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';
import { useTranslation } from 'react-i18next';

export default function ChatScreen() {
  const { t: tBreadcrumbs } = useTranslation('translation', { keyPrefix: 'breadcrumbs' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });

  return (
    <SafeAreaView className="bg-background flex-1">
      <View className="flex-1 items-center justify-center gap-2">
        <Text variant="h3">{tBreadcrumbs('chat')}</Text>
        <Text variant="muted">{tCommon('comingSoon')}</Text>
      </View>
    </SafeAreaView>
  );
}
