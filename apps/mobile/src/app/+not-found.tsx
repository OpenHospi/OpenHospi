import { Link, Stack } from 'expo-router';
import { Text, View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not Found' }} />
      <View className="flex-1 items-center justify-center bg-background p-5">
        <Text className="text-xl font-bold text-foreground">Page not found</Text>
        <Link href={'/' as never} className="mt-4">
          <Text className="text-base text-primary underline">Go back</Text>
        </Link>
      </View>
    </>
  );
}
