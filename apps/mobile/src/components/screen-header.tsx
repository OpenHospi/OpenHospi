import { ChevronLeft } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/design';
import { ThemedButton } from '@/components/primitives/themed-button';
import { ThemedText } from '@/components/primitives/themed-text';

type ScreenHeaderProps = {
  title: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
};

export function ScreenHeader({ title, onBack, rightAction }: ScreenHeaderProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      {onBack && (
        <ThemedButton variant="ghost" size="icon" onPress={onBack}>
          <ChevronLeft size={24} color={colors.foreground} />
        </ThemedButton>
      )}
      <ThemedText variant="headline" style={{ flex: 1 }} numberOfLines={1}>
        {title}
      </ThemedText>
      {rightAction}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: 16,
    gap: 8,
  },
});
