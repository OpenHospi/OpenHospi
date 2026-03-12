import { ChevronRight } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';

import { BottomSheet, type BottomSheetModal } from '@/components/bottom-sheet';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';

type SelectPickerSheetProps = {
  values: readonly string[];
  selected: string | null;
  onSelect: (value: string | null) => void;
  title: string;
  placeholder: string;
  searchPlaceholder: string;
  t: (key: string) => string;
};

export function SelectPickerSheet({
  values,
  selected,
  onSelect,
  title,
  placeholder,
  searchPlaceholder,
  t,
}: SelectPickerSheetProps) {
  const sheetRef = useRef<BottomSheetModal>(null);
  const [search, setSearch] = useState('');

  const filtered = values.filter((v) => {
    if (!search.trim()) return true;
    const label = t(v);
    return label.toLowerCase().includes(search.trim().toLowerCase());
  });

  function handleSelect(value: string) {
    onSelect(selected === value ? null : value);
    sheetRef.current?.dismiss();
    setSearch('');
  }

  return (
    <>
      <Pressable
        onPress={() => sheetRef.current?.present()}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: 12,
          paddingHorizontal: 16,
          borderWidth: 1,
          borderRadius: 12,
        }}
        className="border-input bg-background">
        <Text className={selected ? 'text-foreground' : 'text-muted-foreground'}>
          {selected ? t(selected) : placeholder}
        </Text>
        <ChevronRight size={16} className="text-muted-foreground" />
      </Pressable>

      <BottomSheet ref={sheetRef} title={title} scrollable={false} onDismiss={() => setSearch('')}>
        <View style={{ flex: 1 }}>
          <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
            <Input
              value={search}
              onChangeText={setSearch}
              placeholder={searchPlaceholder}
              autoFocus
            />
          </View>

          <FlatList
            data={filtered}
            keyExtractor={(item) => item}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const isSelected = item === selected;
              return (
                <Pressable
                  onPress={() => handleSelect(item)}
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: 12,
                    borderRadius: 10,
                  }}
                  className={isSelected ? 'bg-primary/10' : ''}>
                  <Text className={isSelected ? 'text-primary font-semibold' : 'text-foreground'}>
                    {t(item)}
                  </Text>
                </Pressable>
              );
            }}
          />
        </View>
      </BottomSheet>
    </>
  );
}
