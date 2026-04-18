import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ThemedInput } from '@/components/native/input';
import { ThemedText } from '@/components/native/text';
import { useTheme } from '@/design';
import { radius } from '@/design/tokens/radius';
import { hapticLight } from '@/lib/haptics';
import { clearPickerCallback, firePickerCallback } from '@/lib/picker-callbacks';

type Params = {
  callbackId: string;
  values: string;
  translationKeyPrefix?: string;
  searchPlaceholder?: string;
  current?: string;
};

function parseStringArray(json: string | undefined): readonly string[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed)) return parsed.filter((v): v is string => typeof v === 'string');
    return [];
  } catch {
    return [];
  }
}

export default function PickOptionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<Params>();
  const { colors } = useTheme();
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });
  const { t } = useTranslation('translation', {
    keyPrefix: params.translationKeyPrefix,
  });

  const values = parseStringArray(params.values);

  const [search, setSearch] = useState('');

  useEffect(() => {
    return () => {
      if (params.callbackId) clearPickerCallback(params.callbackId);
    };
  }, [params.callbackId]);

  const filtered = values.filter((v) => {
    if (!search.trim()) return true;
    const label = params.translationKeyPrefix ? t(v) : v;
    return label.toLowerCase().includes(search.trim().toLowerCase());
  });

  function handleSelect(value: string) {
    hapticLight();
    const next = params.current === value ? null : value;
    firePickerCallback<string | null>(params.callbackId, next);
    clearPickerCallback(params.callbackId);
    router.back();
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.searchArea}>
        <ThemedInput
          value={search}
          onChangeText={setSearch}
          placeholder={params.searchPlaceholder ?? tCommon('search')}
          autoFocus
          accessibilityLabel={tCommon('search')}
        />
      </View>

      <FlashList
        data={filtered}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => {
          const isSelected = item === params.current;
          const label = params.translationKeyPrefix ? t(item) : item;
          return (
            <Pressable
              onPress={() => handleSelect(item)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={label}
              style={[styles.listItem, isSelected && { backgroundColor: colors.primary + '1A' }]}>
              <ThemedText
                variant="body"
                weight={isSelected ? '600' : '400'}
                color={isSelected ? colors.primary : colors.foreground}>
                {label}
              </ThemedText>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchArea: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
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
