import { Pressable, Text, View } from 'react-native';

import { useNetworkStatus } from '@/lib/network';

type ErrorStateProps = {
  onRetry: () => void;
  message?: string;
};

export function ErrorState({ onRetry, message }: ErrorStateProps) {
  const { isOnline } = useNetworkStatus();

  const displayMessage = message ?? (isOnline ? 'Something went wrong' : 'No internet connection');

  const subtitle = isOnline ? 'Please try again' : 'Check your connection and try again';

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 }}>
      <Text className="text-foreground text-lg font-semibold">{displayMessage}</Text>
      <Text className="text-muted-foreground text-sm">{subtitle}</Text>
      <Pressable
        onPress={onRetry}
        style={{ marginTop: 16, paddingVertical: 10, paddingHorizontal: 24, borderRadius: 8 }}
        className="bg-primary">
        <Text className="text-primary-foreground text-sm font-medium">Try again</Text>
      </Pressable>
    </View>
  );
}
