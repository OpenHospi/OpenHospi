import { Link, Stack } from 'expo-router';
import { View } from 'react-native';

import { Text } from '@/components/ui/text';
import { useTranslation } from 'react-i18next';

export default function NotFoundScreen() {
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });

  return (
    <>
      <Stack.Screen options={{ title: 'Not Found' }} />
      <View
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}
        className="bg-background">
        <View
          style={{ alignItems: 'center', justifyContent: 'center', padding: 48 }}
          className="rounded-lg border border-dashed">
          <Text className="text-foreground text-lg font-semibold">Page not found</Text>
          <Link href="/" style={{ marginTop: 16 }}>
            <Text className="text-primary underline">{tCommon('back')}</Text>
          </Link>
        </View>
      </View>
    </>
  );
}
