import { type CitySuggestion, searchCities } from '@openhospi/shared/pdok';

import { PDOK_PROXY_BASE } from '@/lib/constants';
import { useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { type BottomSheetModal } from '@gorhom/bottom-sheet';
import { useTranslation } from 'react-i18next';

import { AppBottomSheetModal as BottomSheet } from '@/components/shared/bottom-sheet';
import { useTheme } from '@/design';
import { radius } from '@/design/tokens/radius';
import { hapticLight } from '@/lib/haptics';
import { NativeIcon } from '@/components/native/icon';
import { ThemedInput } from '@/components/native/input';
import { ThemedText } from '@/components/native/text';

const DEBOUNCE_MS = 300;

type Props = {
  value: string;
  onSelect: (cityName: string) => void;
  placeholder?: string;
};

export function CitySearchInput({ value, onSelect, placeholder }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation('translation', { keyPrefix: 'app.onboarding.citySearch' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });

  const sheetRef = useRef<BottomSheetModal>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  function handleSearch(text: string) {
    setSearch(text);
    setError(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (text.length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await searchCities(text, PDOK_PROXY_BASE);
        setSuggestions(results);
      } catch {
        setSuggestions([]);
        setError(true);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);
  }

  function handleSelect(suggestion: CitySuggestion) {
    hapticLight();
    onSelect(suggestion.name);
    sheetRef.current?.dismiss();
    resetSheet();
  }

  function resetSheet() {
    setSearch('');
    setSuggestions([]);
    setError(false);
    setLoading(false);
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
        <ThemedText variant="body" color={value ? colors.foreground : colors.tertiaryForeground}>
          {value || placeholder || tCommon('city')}
        </ThemedText>
        <NativeIcon name="chevron.right" size={16} color={colors.mutedForeground} />
      </Pressable>

      <BottomSheet
        ref={sheetRef}
        title={tCommon('city')}
        scrollable={false}
        snapPoints={['50%']}
        enableDynamicSizing={false}
        onDismiss={resetSheet}>
        <View style={styles.sheetContent}>
          <View style={styles.searchContainer}>
            <ThemedInput
              value={search}
              onChangeText={handleSearch}
              placeholder={t('searching')}
              autoFocus
            />
          </View>

          {loading && (
            <View style={styles.statusRow}>
              <ActivityIndicator size="small" color={colors.tertiaryForeground} />
              <ThemedText variant="caption1" color={colors.tertiaryForeground}>
                {t('searching')}
              </ThemedText>
            </View>
          )}

          {error && (
            <ThemedText variant="caption1" color={colors.destructive} style={styles.statusText}>
              {t('searchError')}
            </ThemedText>
          )}

          {!loading && !error && search.length >= 2 && suggestions.length === 0 && (
            <ThemedText
              variant="caption1"
              color={colors.tertiaryForeground}
              style={styles.statusText}>
              {t('noResults')}
            </ThemedText>
          )}

          <FlatList
            data={suggestions}
            keyExtractor={(item) => item.id}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const isSelected = item.name === value;
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
                    {item.name}
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
  sheetContent: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  statusText: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  list: {
    flex: 1,
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
