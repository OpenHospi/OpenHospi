import { Link, Stack } from 'expo-router';
import { View } from 'react-native';

import { Text } from '@/components/ui/text';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not Found' }} />
      <View className="flex-1 items-center justify-center bg-background p-5">
        <Text variant="large">Page not found</Text>
        <Link href={'/' as never} className="mt-4">
          <Text className="text-primary underline">Go back</Text>
        </Link>
      </View>
    </>
  );
}
