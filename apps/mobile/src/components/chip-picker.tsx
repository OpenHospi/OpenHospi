import { Pressable, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Text } from '@/components/ui/text';

type ChipPickerProps = {
  values: readonly string[];
  selected: string | null;
  onSelect: (v: string | null) => void;
  translateKey: string;
  t: (key: string) => string;
};

export function ChipPicker({ values, selected, onSelect, translateKey, t }: ChipPickerProps) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {values.map((v) => (
        <Pressable key={v} onPress={() => onSelect(selected === v ? null : v)}>
          <Badge
            variant={selected === v ? 'default' : 'outline'}
            className="rounded-lg px-3 py-1.5">
            <Text>{t(`${translateKey}.${v}`)}</Text>
          </Badge>
        </Pressable>
      ))}
    </View>
  );
}
