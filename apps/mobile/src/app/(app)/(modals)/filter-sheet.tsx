import {
  DiscoverSort,
  Furnishing,
  HouseType,
  LocationTag,
  RoomFeature,
} from '@openhospi/shared/enums';
import { useHeaderHeight } from '@react-navigation/elements';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { CitySearchInput } from '@/components/forms/city-search';
import { ThemedBadge } from '@/components/primitives/themed-badge';
import { ThemedButton } from '@/components/primitives/themed-button';
import { ThemedInput } from '@/components/primitives/themed-input';
import { ThemedText } from '@/components/primitives/themed-text';
import { useTheme } from '@/design';
import { useDiscoverFilters } from '@/context/discover-filters';
import { hapticLight } from '@/lib/haptics';
import type { DiscoverFilters } from '@openhospi/shared/api-types';

function MultiChipSelect({
  values,
  selected,
  onToggle,
  translateKey,
  t,
}: {
  values: readonly string[];
  selected: string[] | undefined;
  onToggle: (v: string) => void;
  translateKey: string;
  t: (key: string) => string;
}) {
  return (
    <View style={chipStyles.grid}>
      {values.map((v) => {
        const isSelected = selected?.includes(v);
        return (
          <Pressable
            key={v}
            onPress={() => {
              hapticLight();
              onToggle(v);
            }}>
            <ThemedBadge
              variant={isSelected ? 'primary' : 'outline'}
              label={t(`${translateKey}.${v}`)}
              style={chipStyles.chip}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const chipStyles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
});

const SORT_LABEL_KEYS: Record<DiscoverSort, string> = {
  [DiscoverSort.newest]: 'sortNewest',
  [DiscoverSort.cheapest]: 'sortCheapest',
  [DiscoverSort.most_expensive]: 'sortMostExpensive',
};

export default function FilterSheetScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t: tEnums } = useTranslation('translation', { keyPrefix: 'enums' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });
  const { t: tFilters } = useTranslation('translation', { keyPrefix: 'app.discover.filters' });

  const headerHeight = useHeaderHeight();
  const { filters: contextFilters, setFilters: setContextFilters } = useDiscoverFilters();
  const [filters, setFilters] = useState<DiscoverFilters>(contextFilters);

  function update(partial: Partial<DiscoverFilters>) {
    setFilters((prev) => ({ ...prev, ...partial }));
  }

  function toggleArrayItem(key: 'features' | 'locationTags', value: string) {
    const current = filters[key] ?? [];
    const next = (current as string[]).includes(value)
      ? (current as string[]).filter((v) => v !== value)
      : [...(current as string[]), value];
    update({ [key]: next.length > 0 ? next : undefined });
  }

  function handleClear() {
    setFilters({});
  }

  function handleApply() {
    setContextFilters(filters);
    router.back();
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: headerHeight }]}
        keyboardShouldPersistTaps="handled">
        <View style={styles.sections}>
          {/* Sort */}
          <View style={styles.section}>
            <ThemedText variant="subheadline" weight="500">
              {tFilters('sort')}
            </ThemedText>
            <View style={chipStyles.grid}>
              {DiscoverSort.values.map((v) => {
                const isSelected = filters.sort === v;
                return (
                  <Pressable
                    key={v}
                    onPress={() => {
                      hapticLight();
                      update({ sort: isSelected ? undefined : v });
                    }}>
                    <ThemedBadge
                      variant={isSelected ? 'primary' : 'outline'}
                      label={tFilters(SORT_LABEL_KEYS[v])}
                      style={chipStyles.chip}
                    />
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* City */}
          <View style={styles.section}>
            <ThemedText variant="subheadline" weight="500">
              {tFilters('city')}
            </ThemedText>
            <CitySearchInput
              value={filters.city ?? ''}
              onSelect={(v) => update({ city: v || undefined })}
              placeholder={tFilters('cityPlaceholder')}
            />
          </View>

          {/* Price range */}
          <View style={styles.section}>
            <ThemedText variant="subheadline" weight="500">
              {tFilters('priceRange')}
            </ThemedText>
            <View style={styles.priceRow}>
              <ThemedInput
                style={styles.priceInput}
                value={filters.minPrice != null ? String(filters.minPrice) : ''}
                onChangeText={(v) => update({ minPrice: v ? Number(v) : undefined })}
                placeholder="Min €"
                keyboardType="numeric"
              />
              <ThemedInput
                style={styles.priceInput}
                value={filters.maxPrice != null ? String(filters.maxPrice) : ''}
                onChangeText={(v) => update({ maxPrice: v ? Number(v) : undefined })}
                placeholder="Max €"
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* House type */}
          <View style={styles.section}>
            <ThemedText variant="subheadline" weight="500">
              {tFilters('houseType')}
            </ThemedText>
            <View style={chipStyles.grid}>
              {HouseType.values.map((v) => {
                const isSelected = filters.houseType === v;
                return (
                  <Pressable
                    key={v}
                    onPress={() => {
                      hapticLight();
                      update({ houseType: isSelected ? undefined : v });
                    }}>
                    <ThemedBadge
                      variant={isSelected ? 'primary' : 'outline'}
                      label={tEnums(`house_type.${v}`)}
                      style={chipStyles.chip}
                    />
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Furnishing */}
          <View style={styles.section}>
            <ThemedText variant="subheadline" weight="500">
              {tFilters('furnishing')}
            </ThemedText>
            <View style={chipStyles.grid}>
              {Furnishing.values.map((v) => {
                const isSelected = filters.furnishing === v;
                return (
                  <Pressable
                    key={v}
                    onPress={() => {
                      hapticLight();
                      update({ furnishing: isSelected ? undefined : v });
                    }}>
                    <ThemedBadge
                      variant={isSelected ? 'primary' : 'outline'}
                      label={tEnums(`furnishing.${v}`)}
                      style={chipStyles.chip}
                    />
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Available from */}
          <View style={styles.section}>
            <ThemedText variant="subheadline" weight="500">
              {tFilters('availableFrom')}
            </ThemedText>
            <ThemedInput
              value={filters.availableFrom ?? ''}
              onChangeText={(v) => update({ availableFrom: v || undefined })}
              placeholder="YYYY-MM-DD"
            />
          </View>

          {/* Features */}
          <View style={styles.section}>
            <ThemedText variant="subheadline" weight="500">
              {tFilters('features')}
            </ThemedText>
            <MultiChipSelect
              values={RoomFeature.values}
              selected={filters.features}
              onToggle={(v) => toggleArrayItem('features', v)}
              translateKey="room_feature"
              t={tEnums}
            />
          </View>

          {/* Location tags */}
          <View style={[styles.section, { marginBottom: 16 }]}>
            <ThemedText variant="subheadline" weight="500">
              {tFilters('locationTags')}
            </ThemedText>
            <MultiChipSelect
              values={LocationTag.values}
              selected={filters.locationTags}
              onToggle={(v) => toggleArrayItem('locationTags', v)}
              translateKey="location_tag"
              t={tEnums}
            />
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <View style={styles.footerButtons}>
          <ThemedButton onPress={handleApply}>{tCommon('apply')}</ThemedButton>
          <ThemedButton variant="ghost" onPress={handleClear}>
            {tFilters('clearFilters')}
          </ThemedButton>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  sections: {
    gap: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  section: {
    gap: 8,
  },
  priceRow: {
    flexDirection: 'row',
    gap: 12,
  },
  priceInput: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerButtons: {
    gap: 8,
  },
});
