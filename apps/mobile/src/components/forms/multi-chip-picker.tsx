import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedBadge } from '@/components/primitives/themed-badge';
import { radius } from '@/design/tokens/radius';

type MultiChipPickerProps = {
  values: readonly string[];
  selected: string[];
  onToggle: (v: string[]) => void;
  translateKey: string;
  t: (key: string) => string;
};

export function MultiChipPicker({
  values,
  selected,
  onToggle,
  translateKey,
  t,
}: MultiChipPickerProps) {
  const toggle = (v: string) => {
    if (selected.includes(v)) {
      onToggle(selected.filter((s) => s !== v));
    } else {
      onToggle([...selected, v]);
    }
  };

  return (
    <View style={styles.container}>
      {values.map((v) => {
        const isSelected = selected.includes(v);
        return (
          <Pressable key={v} onPress={() => toggle(v)}>
            <ThemedBadge
              variant={isSelected ? 'primary' : 'outline'}
              label={t(`${translateKey}.${v}`)}
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
