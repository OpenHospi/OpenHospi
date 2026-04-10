import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedBadge } from '@/components/primitives/themed-badge';

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
      {values.map((v) => (
        <Pressable key={v} onPress={() => onSelect(selected === v ? null : v)}>
          <ThemedBadge
            variant={selected === v ? 'primary' : 'outline'}
            label={t(`${translateKey}.${v}`)}
            style={styles.chip}
          />
        </Pressable>
      ))}
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
    borderRadius: 10,
  },
});
