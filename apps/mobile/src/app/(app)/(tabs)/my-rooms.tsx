import { Home } from 'lucide-react-native';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';
import { useTranslation } from 'react-i18next';

export default function MyRoomsScreen() {
  const { t: tBreadcrumbs } = useTranslation('translation', { keyPrefix: 'breadcrumbs' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });

  return (
    <SafeAreaView
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}
      className="bg-background"
      edges={['top']}>
      <View
        style={{ alignItems: 'center', justifyContent: 'center', padding: 48 }}
        className="rounded-lg border border-dashed">
        <Home size={32} className="text-muted-foreground" />
        <Text style={{ marginTop: 16 }} className="text-foreground text-lg font-semibold">
          {tBreadcrumbs('my-rooms')}
        </Text>
        <Text variant="muted" style={{ marginTop: 4 }} className="text-center text-sm">
          {tCommon('comingSoon')}
        </Text>
      </View>
    </SafeAreaView>
  );
}
