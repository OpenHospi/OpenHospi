import type { LucideIcon } from 'lucide-react-native';
import { StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { useTheme } from '@/design';
import { ThemedButton } from '@/components/primitives/themed-button';
import { ThemedText } from '@/components/primitives/themed-text';

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({
  icon: Icon,
  title,
  subtitle,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.container}>
      <Icon size={48} color={colors.mutedForeground} />
      <ThemedText variant="headline" style={styles.centered}>
        {title}
      </ThemedText>
      {subtitle && (
        <ThemedText variant="subheadline" color={colors.mutedForeground} style={styles.centered}>
          {subtitle}
        </ThemedText>
      )}
      {actionLabel && onAction && (
        <ThemedButton onPress={onAction} style={{ marginTop: 8 }}>
          {actionLabel}
        </ThemedButton>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  centered: {
    textAlign: 'center',
  },
});
