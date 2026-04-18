import { type CitySuggestion, searchCities } from '@openhospi/shared/pdok';
import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ThemedInput } from '@/components/native/input';
import { ThemedSkeleton } from '@/components/native/skeleton';
import { ThemedText } from '@/components/native/text';
import { useTheme } from '@/design';
import { radius } from '@/design/tokens/radius';
import { PDOK_PROXY_BASE } from '@/lib/constants';
import { hapticLight } from '@/lib/haptics';
import { clearPickerCallback, firePickerCallback } from '@/lib/picker-callbacks';

const DEBOUNCE_MS = 300;

export default function PickCityScreen() {
  const router = useRouter();
  const { callbackId, current } = useLocalSearchParams<{ callbackId: string; current?: string }>();
  const { colors } = useTheme();
  const { t } = useTranslation('translation', { keyPrefix: 'app.onboarding.citySearch' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });

  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    return () => {
      if (callbackId) clearPickerCallback(callbackId);
    };
  }, [callbackId]);

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

  function handleSelect(item: CitySuggestion) {
    hapticLight();
    firePickerCallback(callbackId, item.name);
    clearPickerCallback(callbackId);
    router.back();
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.searchArea}>
        <ThemedInput
          value={search}
          onChangeText={handleSearch}
          placeholder={t('searching')}
          autoFocus
          accessibilityLabel={tCommon('search')}
        />
      </View>

      {loading ? (
        <View style={styles.skeletonList}>
          {Array.from({ length: 6 }, (_, i) => (
            <ThemedSkeleton key={i} height={44} rounded="md" />
          ))}
        </View>
      ) : error ? (
        <ThemedText variant="caption1" color={colors.destructive} style={styles.statusText}>
          {t('searchError')}
        </ThemedText>
      ) : search.length >= 2 && suggestions.length === 0 ? (
        <ThemedText variant="caption1" color={colors.tertiaryForeground} style={styles.statusText}>
          {t('noResults')}
        </ThemedText>
      ) : (
        <FlashList
          data={suggestions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const isSelected = item.name === current;
            return (
              <Pressable
                onPress={() => handleSelect(item)}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={item.name}
                style={[styles.listItem, isSelected && { backgroundColor: colors.primary + '1A' }]}>
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
      )}
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
  skeletonList: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
  },
  statusText: {
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
