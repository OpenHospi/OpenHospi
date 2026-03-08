import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTranslation } from 'react-i18next';

export default function ChatScreen() {
  const { t: tBreadcrumbs } = useTranslation('translation', { keyPrefix: 'breadcrumbs' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center gap-2">
        <Text className="text-2xl font-bold text-foreground">{tBreadcrumbs('chat')}</Text>
        <Text className="text-base text-muted-foreground">{tCommon('comingSoon')}</Text>
      </View>
    </SafeAreaView>
  );
}
