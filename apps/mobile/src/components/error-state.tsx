import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/design';
import { radius } from '@/design/tokens/radius';
import { ThemedText } from '@/components/primitives/themed-text';
import { useNetworkStatus } from '@/lib/network';

type ErrorStateProps = {
  onRetry: () => void;
  message?: string;
};

export function ErrorState({ onRetry, message }: ErrorStateProps) {
  const { isOnline } = useNetworkStatus();
  const { colors } = useTheme();

  const displayMessage = message ?? (isOnline ? 'Something went wrong' : 'No internet connection');

  const subtitle = isOnline ? 'Please try again' : 'Check your connection and try again';

  return (
    <View style={styles.container}>
      <ThemedText variant="headline">{displayMessage}</ThemedText>
      <ThemedText variant="subheadline" color={colors.mutedForeground}>
        {subtitle}
      </ThemedText>
      <Pressable
        onPress={onRetry}
        style={[styles.retryButton, { backgroundColor: colors.primary }]}>
        <ThemedText variant="subheadline" weight="500" color={colors.primaryForeground}>
          Try again
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  retryButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: radius.md,
  },
});
