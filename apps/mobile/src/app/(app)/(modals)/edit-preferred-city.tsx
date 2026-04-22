import { type CitySuggestion, searchCities } from '@openhospi/shared/pdok';
import { useHeaderHeight } from '@react-navigation/elements';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { NativeButton } from '@/components/native/button';
import { ThemedInput } from '@/components/native/input';
import { ThemedSkeleton } from '@/components/native/skeleton';
import { ThemedText } from '@/components/native/text';
import { useTheme } from '@/design';
import { radius } from '@/design/tokens/radius';
import { PDOK_PROXY_BASE } from '@/lib/constants';
import { hapticFormSubmitError, hapticFormSubmitSuccess, hapticLight } from '@/lib/haptics';
import { useProfile, useUpdateProfile } from '@/services/profile';

const DEBOUNCE_MS = 300;

export default function EditPreferredCityScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const headerHeight = useHeaderHeight();
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });
  const { t: tPlaceholders } = useTranslation('translation', {
    keyPrefix: 'app.onboarding.placeholders',
  });
  const { t: tCitySearch } = useTranslation('translation', {
    keyPrefix: 'app.onboarding.citySearch',
  });

  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const [selected, setSelected] = useState<string | null>(profile?.preferredCity ?? null);
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  function handleSearch(text: string) {
    setSearch(text);
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
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);
  }

  function handleSave() {
    if (updateProfile.isPending) return;
    updateProfile.mutate(
      { preferredCity: selected ?? null },
      {
        onSuccess: () => {
          hapticFormSubmitSuccess();
          router.back();
        },
        onError: () => {
          hapticFormSubmitError();
          Alert.alert('Error');
        },
      }
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.searchArea, { paddingTop: headerHeight + 12 }]}>
        <ThemedInput
          value={search}
          onChangeText={handleSearch}
          placeholder={tPlaceholders('searchCity')}
          autoFocus
          accessibilityLabel={tPlaceholders('searchCity')}
        />
      </View>

      {loading ? (
        <View style={styles.skeletonList}>
          {Array.from({ length: 6 }, (_, i) => (
            <ThemedSkeleton key={i} height={44} rounded="md" />
          ))}
        </View>
      ) : search.length >= 2 && suggestions.length === 0 ? (
        <ThemedText variant="caption1" color={colors.tertiaryForeground} style={styles.statusText}>
          {tCitySearch('noResults')}
        </ThemedText>
      ) : (
        <FlashList
          data={suggestions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const isSelected = item.name === selected;
            return (
              <Pressable
                onPress={() => {
                  hapticLight();
                  setSelected(isSelected ? null : item.name);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={item.name}
                style={[styles.listItem, isSelected && { backgroundColor: colors.primary + '1A' }]}>
                <ThemedText
                  variant="body"
                  weight={isSelected ? '600' : undefined}
                  color={isSelected ? colors.primary : colors.foreground}>
                  {item.name}
                </ThemedText>
              </Pressable>
            );
          }}
        />
      )}

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <NativeButton
          label={tCommon('save')}
          onPress={handleSave}
          loading={updateProfile.isPending}
          accessibilityLabel={tCommon('save')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchArea: {
    paddingHorizontal: 16,
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
    paddingTop: 8,
    paddingBottom: 8,
  },
  listItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: radius.md,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
