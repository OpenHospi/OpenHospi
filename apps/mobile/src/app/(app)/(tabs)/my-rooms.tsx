import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTranslations } from '@/i18n';

export default function MyRoomsScreen() {
  const tBreadcrumbs = useTranslations('breadcrumbs');
  const tCommon = useTranslations('common.labels');

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center gap-2">
        <Text className="text-2xl font-bold text-foreground">{tBreadcrumbs('my-rooms')}</Text>
        <Text className="text-base text-muted-foreground">{tCommon('comingSoon')}</Text>
      </View>
    </SafeAreaView>
  );
}
