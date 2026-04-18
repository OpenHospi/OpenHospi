import {
  type AddressResult,
  type AddressSuggestion,
  lookupAddress,
  searchAddresses,
} from '@openhospi/shared/pdok';
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

export default function PickAddressScreen() {
  const router = useRouter();
  const { callbackId } = useLocalSearchParams<{ callbackId: string }>();
  const { colors } = useTheme();
  const { t } = useTranslation('translation', { keyPrefix: 'app.rooms' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });

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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.searchArea}>
        <ThemedInput
          value={search}
          onChangeText={handleSearch}
          placeholder={t('placeholders.searchAddress')}
          autoFocus
          accessibilityLabel={tCommon('search')}
        />
      </View>

      {loading || resolving ? (
        <View style={styles.skeletonList}>
          {Array.from({ length: 6 }, (_, i) => (
            <ThemedSkeleton key={i} height={56} rounded="md" />
          ))}
        </View>
      ) : error ? (
        <ThemedText variant="caption1" color={colors.destructive} style={styles.statusText}>
          {t('addressSearch.searchError')}
        </ThemedText>
      ) : search.length >= 2 && suggestions.length === 0 ? (
        <ThemedText variant="caption1" color={colors.tertiaryForeground} style={styles.statusText}>
          {t('addressSearch.noResults')}
        </ThemedText>
      ) : (
        <FlashList
          data={suggestions}
          keyExtractor={(item) => item.id}
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
