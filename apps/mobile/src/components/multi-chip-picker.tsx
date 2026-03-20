import { Pressable, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Text } from '@/components/ui/text';

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
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {values.map((v) => {
        const isSelected = selected.includes(v);
        return (
          <Pressable key={v} onPress={() => toggle(v)}>
            <Badge variant={isSelected ? 'default' : 'outline'} className="rounded-lg px-3 py-1.5">
              <Text>{t(`${translateKey}.${v}`)}</Text>
            </Badge>
          </Pressable>
        );
      })}
    </View>
  );
}
