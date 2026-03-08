import { Home } from 'lucide-react-native';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';
import { useTranslation } from 'react-i18next';

export default function MyRoomsScreen() {
  const { t: tBreadcrumbs } = useTranslation('translation', { keyPrefix: 'breadcrumbs' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });

  return (
    <SafeAreaView className="bg-background flex-1">
      <View className="flex-1 items-center justify-center px-8">
        <View className="items-center justify-center rounded-lg border border-dashed p-12">
          <Home size={32} className="text-muted-foreground" />
          <Text className="mt-4 text-lg font-semibold">{tBreadcrumbs('my-rooms')}</Text>
          <Text variant="muted" className="mt-1 text-center text-sm">
            {tCommon('comingSoon')}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
