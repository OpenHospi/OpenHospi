import { type CitySuggestion, searchCities } from '@openhospi/shared/pdok';
import { useCallback, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/design';
import { radius } from '@/design/tokens/radius';
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
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const handleSearch = useCallback((text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (text.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const results = await searchCities(text);
      setSuggestions(results);
      setIsOpen(results.length > 0);
    }, DEBOUNCE_MS);
  }, []);

  function handleSelect(suggestion: CitySuggestion) {
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
      {isOpen && suggestions.length > 0 && (
        <View
          style={[
            styles.dropdown,
            {
              borderColor: colors.border,
              backgroundColor: colors.card,
            },
          ]}>
          <FlatList
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
});
