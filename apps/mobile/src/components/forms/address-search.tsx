import {
  type AddressResult,
  type AddressSuggestion,
  lookupAddress,
  searchAddresses,
} from '@openhospi/shared/pdok';
import { ChevronRight } from 'lucide-react-native';

import { PDOK_PROXY_BASE } from '@/lib/constants';
import { useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { type BottomSheetModal } from '@gorhom/bottom-sheet';
import { useTranslation } from 'react-i18next';

import { AppBottomSheetModal as BottomSheet } from '@/components/shared/bottom-sheet';
import { useTheme } from '@/design';
import { radius } from '@/design/tokens/radius';
import { hapticLight } from '@/lib/haptics';
import { ThemedInput } from '@/components/native/input';
import { ThemedText } from '@/components/native/text';

const DEBOUNCE_MS = 300;

type Props = {
  displayValue: string;
  onSelect: (address: AddressResult) => void;
  placeholder?: string;
};

export function AddressSearchInput({ displayValue, onSelect, placeholder }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation('translation', { keyPrefix: 'app.rooms' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common' });

  const sheetRef = useRef<BottomSheetModal>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState(false);
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
        onSelect(address);
        sheetRef.current?.dismiss();
        resetSheet();
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setResolving(false);
    }
  }

  function resetSheet() {
    setSearch('');
    setSuggestions([]);
    setError(false);
    setLoading(false);
    setResolving(false);
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
        <ThemedText
          variant="body"
          color={displayValue ? colors.foreground : colors.tertiaryForeground}
          numberOfLines={1}>
          {displayValue || placeholder || t('fields.address')}
        </ThemedText>
        <ChevronRight size={16} color={colors.mutedForeground} />
      </Pressable>

      <BottomSheet
        ref={sheetRef}
        title={t('fields.address')}
        scrollable={false}
        snapPoints={['60%']}
        enableDynamicSizing={false}
        onDismiss={resetSheet}>
        <View style={styles.sheetContent}>
          <View style={styles.searchContainer}>
            <ThemedInput
              value={search}
              onChangeText={handleSearch}
              placeholder={t('placeholders.searchAddress')}
              autoFocus
            />
          </View>

          {loading && (
            <View style={styles.statusRow}>
              <ActivityIndicator size="small" color={colors.tertiaryForeground} />
              <ThemedText variant="caption1" color={colors.tertiaryForeground}>
                {tCommon('searching')}
              </ThemedText>
            </View>
          )}

          {resolving && (
            <View style={styles.statusRow}>
              <ActivityIndicator size="small" color={colors.tertiaryForeground} />
              <ThemedText variant="caption1" color={colors.tertiaryForeground}>
                {t('addressSearch.resolving')}
              </ThemedText>
            </View>
          )}

          {error && (
            <ThemedText variant="caption1" color={colors.destructive} style={styles.statusText}>
              {t('addressSearch.searchError')}
            </ThemedText>
          )}

          {!loading && !error && !resolving && search.length >= 2 && suggestions.length === 0 && (
            <ThemedText
              variant="caption1"
              color={colors.tertiaryForeground}
              style={styles.statusText}>
              {t('addressSearch.noResults')}
            </ThemedText>
          )}

          <FlatList
            data={suggestions}
            keyExtractor={(item) => item.id}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable
                onPress={() => handleSelect(item)}
                disabled={resolving}
                style={[styles.listItem, resolving && { opacity: 0.5 }]}>
                <ThemedText variant="body" numberOfLines={2}>
                  {item.displayName}
                </ThemedText>
              </Pressable>
            )}
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
