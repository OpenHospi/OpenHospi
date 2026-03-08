import { Link, Stack } from 'expo-router';
import { View } from 'react-native';

import { Text } from '@/components/ui/text';
import { useTranslation } from 'react-i18next';

export default function NotFoundScreen() {
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });

  return (
    <>
      <Stack.Screen options={{ title: 'Not Found' }} />
      <View className="bg-background flex-1 items-center justify-center p-5">
        <View className="items-center justify-center rounded-lg border border-dashed p-12">
          <Text className="text-lg font-semibold">Page not found</Text>
          <Link href={'/' as never} className="mt-4">
            <Text className="text-primary underline">{tCommon('back')}</Text>
          </Link>
        </View>
      </View>
    </>
  );
}
