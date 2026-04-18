import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedBadge } from '@/components/native/badge';
import { radius } from '@/design/tokens/radius';
import { hapticLight } from '@/lib/haptics';

type ChipPickerProps = {
  values: readonly string[];
  selected: string | null;
  onSelect: (v: string | null) => void;
  translateKey: string;
  t: (key: string) => string;
};

export function ChipPicker({ values, selected, onSelect, translateKey, t }: ChipPickerProps) {
  return (
    <View style={styles.container}>
      {values.map((v) => {
        const label = t(`${translateKey}.${v}`);
        const isSelected = selected === v;
        return (
          <Pressable
            key={v}
            accessibilityRole="checkbox"
            accessibilityLabel={label}
            accessibilityState={{ checked: isSelected }}
            onPress={() => {
              hapticLight();
              onSelect(isSelected ? null : v);
            }}>
            <ThemedBadge
              variant={isSelected ? 'primary' : 'outline'}
              label={label}
              style={styles.chip}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.md,
  },
});
