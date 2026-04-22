import {
  type AddressResult,
  type AddressSuggestion,
  lookupAddress,
  searchAddresses,
} from '@openhospi/shared/pdok';
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

export default function PickAddressScreen() {
  const router = useRouter();
  const { callbackId } = useLocalSearchParams<{ callbackId: string }>();
  const { colors } = useTheme();
  const { t } = useTranslation('translation', { keyPrefix: 'app.rooms' });

  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState(false);
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
        const results = await searchAddresses(text, PDOK_PROXY_BASE);
        setSuggestions(results);
      } catch {
        setSuggestions([]);
        setError(true);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);
  }

  async function handleSelect(suggestion: AddressSuggestion) {
    hapticLight();
    setResolving(true);
    try {
      const address = await lookupAddress(suggestion.id, PDOK_PROXY_BASE);
      if (address) {
        firePickerCallback<AddressResult>(callbackId, address);
        clearPickerCallback(callbackId);
        router.back();
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setResolving(false);
    }
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: t('fields.address'),
          headerSearchBarOptions: {
            placeholder: t('placeholders.searchAddress'),
            autoCapitalize: 'none',
            autoFocus: true,
            hideWhenScrolling: false,
            onChangeText: (e) => handleSearch(e.nativeEvent.text),
            onCancelButtonPress: () => handleSearch(''),
          },
        }}
      />
      {loading || resolving ? (
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={styles.skeletonList}
          style={{ backgroundColor: colors.background }}>
          {Array.from({ length: 6 }, (_, i) => (
            <ThemedSkeleton key={i} height={56} rounded="md" />
          ))}
        </ScrollView>
      ) : error ? (
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          style={{ backgroundColor: colors.background }}>
          <ThemedText variant="caption1" color={colors.destructive} style={styles.statusText}>
            {t('addressSearch.searchError')}
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
            {t('addressSearch.noResults')}
          </ThemedText>
        </ScrollView>
      ) : (
        <FlashList
          data={suggestions}
          keyExtractor={(item) => item.id}
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <Pressable
              onPress={() => handleSelect(item)}
              disabled={resolving}
              accessibilityRole="button"
              accessibilityLabel={item.displayName}
              style={({ pressed }) => [
                styles.listItem,
                pressed && { backgroundColor: colors.secondaryBackground },
                resolving && { opacity: 0.5 },
              ]}>
              <ThemedText variant="body" numberOfLines={2}>
                {item.displayName}
              </ThemedText>
            </Pressable>
          )}
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
