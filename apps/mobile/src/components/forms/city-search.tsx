import { type CitySuggestion, searchCities } from '@openhospi/shared/pdok';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/design';
import { radius } from '@/design/tokens/radius';
import { hapticLight } from '@/lib/haptics';
import { ThemedInput } from '@/components/primitives/themed-input';
import { ThemedText } from '@/components/primitives/themed-text';

const DEBOUNCE_MS = 300;

type Props = {
  value: string;
  onSelect: (cityName: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
};

export function CitySearchInput({ value, onSelect, placeholder, autoFocus }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation('translation', { keyPrefix: 'app.onboarding.citySearch' });

  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const handleSearch = useCallback((text: string) => {
    setQuery(text);
    setError(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (text.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await searchCities(text);
        setSuggestions(results);
        setIsOpen(results.length > 0);
        if (results.length === 0) setError(false);
      } catch {
        setSuggestions([]);
        setIsOpen(false);
        setError(true);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);
  }, []);

  function handleSelect(suggestion: CitySuggestion) {
    hapticLight();
    setQuery(suggestion.name);
    setSuggestions([]);
    setIsOpen(false);
    onSelect(suggestion.name);
  }

  return (
    <View>
      <ThemedInput
        value={query}
        onChangeText={handleSearch}
        placeholder={placeholder}
        autoFocus={autoFocus}
      />
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
      {!loading && !error && query.length >= 2 && suggestions.length === 0 && !isOpen && (
        <ThemedText variant="caption1" color={colors.tertiaryForeground} style={styles.statusText}>
          {t('noResults')}
        </ThemedText>
      )}
      {isOpen && suggestions.length > 0 && (
        <View
          style={[
            styles.dropdown,
            {
              borderColor: colors.border,
              backgroundColor: colors.card,
            },
          ]}>
          <FlashList
            data={suggestions}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            scrollEnabled={false}
            renderItem={({ item }) => (
              <Pressable onPress={() => handleSelect(item)} style={styles.dropdownItem}>
                <ThemedText variant="body">{item.name}</ThemedText>
              </Pressable>
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  dropdown: {
    marginTop: 4,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  statusText: {
    marginTop: 6,
  },
});
