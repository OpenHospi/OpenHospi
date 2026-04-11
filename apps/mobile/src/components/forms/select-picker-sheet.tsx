import { ChevronRight } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import {
  AppBottomSheetModal as BottomSheet,
  type BottomSheetModal,
} from '@/components/shared/bottom-sheet';
import { useTheme } from '@/design';
import { radius } from '@/design/tokens/radius';
import { ThemedInput } from '@/components/primitives/themed-input';
import { ThemedText } from '@/components/primitives/themed-text';

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
  const { colors } = useTheme();
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
        style={[
          styles.trigger,
          {
            borderColor: colors.input,
            backgroundColor: colors.background,
          },
        ]}>
        <ThemedText variant="body" color={selected ? colors.foreground : colors.tertiaryForeground}>
          {selected ? t(selected) : placeholder}
        </ThemedText>
        <ChevronRight size={16} color={colors.mutedForeground} />
      </Pressable>

      <BottomSheet
        ref={sheetRef}
        title={title}
        scrollable={false}
        snapPoints={['60%']}
        enableDynamicSizing={false}
        onDismiss={() => setSearch('')}>
        <View style={{ flex: 1 }}>
          <View style={styles.searchContainer}>
            <ThemedInput
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
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const isSelected = item === selected;
              return (
                <Pressable
                  onPress={() => handleSelect(item)}
                  style={[
                    styles.listItem,
                    isSelected && { backgroundColor: colors.primary + '1A' },
                  ]}>
                  <ThemedText
                    variant="body"
                    weight={isSelected ? '600' : '400'}
                    color={isSelected ? colors.primary : colors.foreground}>
                    {t(item)}
                  </ThemedText>
                </Pressable>
              );
            }}
          />
        </View>
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  listItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: radius.md,
  },
});
