import { SymbolView } from 'expo-symbols';
import { MaterialIcons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/primitives/themed-text';
import { useTheme } from '@/design';
import { isIOS } from '@/lib/platform';

type Props = {
  isVerified: boolean;
  compact?: boolean;
};

export function VerificationBadge({ isVerified, compact = true }: Props) {
  const { colors } = useTheme();

  if (!isVerified) return null;

  if (compact) {
    return isIOS ? (
      <SymbolView name="checkmark.shield" size={14} tintColor={colors.success} />
    ) : (
      <MaterialIcons name="verified-user" size={14} color={colors.success} />
    );
  }

  return (
    <View style={styles.container}>
      {isIOS ? (
        <SymbolView name="checkmark.shield" size={14} tintColor={colors.success} />
      ) : (
        <MaterialIcons name="verified-user" size={14} color={colors.success} />
      )}
      <ThemedText variant="caption1" weight="500" color={colors.success}>
        Verified
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
