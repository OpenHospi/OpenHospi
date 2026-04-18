import { type CitySuggestion, searchCities } from '@openhospi/shared/pdok';
import { FlashList } from '@shopify/flash-list';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

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
    <>
      <Stack.Screen
        options={{
          title: tCommon('city'),
          headerSearchBarOptions: {
            placeholder: t('searching'),
            autoCapitalize: 'none',
            autoFocus: true,
            hideWhenScrolling: false,
            onChangeText: (e) => handleSearch(e.nativeEvent.text),
            onCancelButtonPress: () => handleSearch(''),
          },
        }}
      />
      {loading ? (
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={[styles.skeletonList, { backgroundColor: colors.background }]}
          style={{ backgroundColor: colors.background }}>
          {Array.from({ length: 6 }, (_, i) => (
            <ThemedSkeleton key={i} height={44} rounded="md" />
          ))}
        </ScrollView>
      ) : error ? (
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          style={{ backgroundColor: colors.background }}>
          <ThemedText variant="caption1" color={colors.destructive} style={styles.statusText}>
            {t('searchError')}
          </ThemedText>
        </ScrollView>
      ) : search.length >= 2 && suggestions.length === 0 ? (
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          style={{ backgroundColor: colors.background }}>
          <ThemedText
            variant="caption1"
            color={colors.tertiaryForeground}
            style={styles.statusText}>
            {t('noResults')}
          </ThemedText>
        </ScrollView>
      ) : (
        <FlashList
          data={suggestions}
          keyExtractor={(item) => item.id}
          contentInsetAdjustmentBehavior="automatic"
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
    </>
  );
}

const styles = StyleSheet.create({
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
