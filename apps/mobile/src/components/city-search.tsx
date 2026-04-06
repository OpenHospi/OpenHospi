import { type CitySuggestion, searchCities } from '@openhospi/shared/pdok';
import { useCallback, useRef, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';

import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';

const DEBOUNCE_MS = 300;

type Props = {
  value: string;
  onSelect: (cityName: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
};

export function CitySearchInput({ value, onSelect, placeholder, autoFocus }: Props) {
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
      <Input
        value={query}
        onChangeText={handleSearch}
        placeholder={placeholder}
        autoFocus={autoFocus}
      />
      {isOpen && suggestions.length > 0 && (
        <View className="border-border bg-card rounded-xl border" style={{ marginTop: 4 }}>
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            scrollEnabled={false}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => handleSelect(item)}
                style={{ paddingVertical: 12, paddingHorizontal: 14 }}>
                <Text className="text-foreground">{item.name}</Text>
              </Pressable>
            )}
          />
        </View>
      )}
    </View>
  );
}
