import { ChevronRight } from 'lucide-react-native';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/native/text';
import { useTheme } from '@/design';
import { hapticLight } from '@/lib/haptics';

type ProfileFieldRowProps = {
  label: string;
  value: string | null | undefined;
  placeholder: string;
  onPress: () => void;
};

export function ProfileFieldRow({ label, value, placeholder, onPress }: ProfileFieldRowProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={() => {
        hapticLight();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${value ?? placeholder}`}
      android_ripple={{ color: 'rgba(0,0,0,0.08)' }}
      style={({ pressed }) => [
        styles.row,
        pressed && Platform.OS === 'ios' ? { backgroundColor: colors.muted } : undefined,
      ]}>
      <ThemedText variant="body">{label}</ThemedText>
      <View style={styles.valueRow}>
        <ThemedText
          variant="body"
          color={value ? colors.tertiaryForeground : colors.tertiaryForeground}>
          {value ?? placeholder}
        </ThemedText>
        <ChevronRight size={16} color={colors.tertiaryForeground} strokeWidth={2.5} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    minHeight: Platform.select({ ios: 44, android: 48 }),
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
