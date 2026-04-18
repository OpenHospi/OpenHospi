import {
  DiscoverSort,
  Furnishing,
  HouseType,
  LocationTag,
  RoomFeature,
} from '@openhospi/shared/enums';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { DatePickerSheet } from '@/components/forms/date-picker-sheet';
import { GroupedSection } from '@/components/layout/grouped-section';
import { ListCell } from '@/components/layout/list-cell';
import { NativeIcon } from '@/components/native/icon';
import { ThemedText } from '@/components/native/text';
import { useDiscoverFilters } from '@/context/discover-filters';
import { useTheme } from '@/design';
import { registerPickerCallback } from '@/lib/picker-callbacks';
import { hapticLight } from '@/lib/haptics';
import { isIOS } from '@/lib/platform';
import type { DiscoverFilters } from '@openhospi/shared/api-types';

const SORT_LABEL_KEYS: Record<DiscoverSort, string> = {
  [DiscoverSort.newest]: 'sortNewest',
  [DiscoverSort.cheapest]: 'sortCheapest',
  [DiscoverSort.most_expensive]: 'sortMostExpensive',
};

function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function fromISODate(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function Divider() {
  const { colors, spacing } = useTheme();
  return (
    <View
      style={{
        height: StyleSheet.hairlineWidth,
        backgroundColor: colors.separator,
        marginLeft: spacing.lg,
      }}
    />
  );
}

type PriceRowProps = {
  label: string;
  value: number | undefined;
  placeholder: string;
  onChange: (v: number | undefined) => void;
};

function PriceRow({ label, value, placeholder, onChange }: PriceRowProps) {
  const { colors, typography } = useTheme();

  return (
    <View style={styles.priceRow}>
      <ThemedText variant="body" style={styles.priceLabel}>
        {label}
      </ThemedText>
      <TextInput
        style={[styles.priceInput, typography.body, { color: colors.foreground }]}
        value={value != null ? String(value) : ''}
        onChangeText={(v) => {
          const digits = v.replace(/[^0-9]/g, '');
          onChange(digits ? Number(digits) : undefined);
        }}
        placeholder={placeholder}
        placeholderTextColor={colors.tertiaryForeground}
        keyboardType="numeric"
        returnKeyType="done"
        inputMode="numeric"
        accessibilityLabel={label}
      />
    </View>
  );
}

export default function FilterSheetScreen() {
  const router = useRouter();
  const { colors, spacing } = useTheme();
  const { t: tEnums } = useTranslation('translation', { keyPrefix: 'enums' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });
  const { t: tFilters } = useTranslation('translation', { keyPrefix: 'app.discover.filters' });

  const { filters: contextFilters, setFilters: setContextFilters } = useDiscoverFilters();
  const [filters, setFilters] = useState<DiscoverFilters>(contextFilters);

  const isDirty = JSON.stringify(filters) !== JSON.stringify(contextFilters);
  const activeCount = Object.values(filters).filter(
    (v) => v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && v.length === 0)
  ).length;

  function update(partial: Partial<DiscoverFilters>) {
    setFilters((prev) => ({ ...prev, ...partial }));
  }

  function toggleArrayItem(key: 'features' | 'locationTags', value: string) {
    const current = (filters[key] ?? []) as string[];
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    update({ [key]: next.length > 0 ? next : undefined });
  }

  function handleApply() {
    hapticLight();
    setContextFilters(filters);
    router.back();
  }

  function handleClear() {
    hapticLight();
    setFilters({});
  }

  function openCityPicker() {
    hapticLight();
    const callbackId = registerPickerCallback<string>((city) =>
      update({ city: city || undefined })
    );
    router.push({
      pathname: '/(pickers)/pick-city',
      params: { callbackId, current: filters.city ?? '' },
    });
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerLeft:
            activeCount > 0
              ? () => (
                  <Pressable
                    onPress={handleClear}
                    accessibilityRole="button"
                    accessibilityLabel={tFilters('clearFilters')}
                    hitSlop={8}>
                    <ThemedText variant="body" color={colors.primary}>
                      {tCommon('reset')}
                    </ThemedText>
                  </Pressable>
                )
              : undefined,
          headerRight: () => (
            <Pressable
              onPress={handleApply}
              disabled={!isDirty}
              accessibilityRole="button"
              accessibilityLabel={tCommon('apply')}
              hitSlop={8}>
              <ThemedText
                variant="body"
                weight="600"
                color={isDirty ? colors.primary : colors.tertiaryForeground}>
                {tCommon('apply')}
              </ThemedText>
            </Pressable>
          ),
        }}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={[styles.scroll, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag">
        <View style={[styles.groups, { gap: spacing.xl }]}>
          {/* Sort */}
          <GroupedSection header={tFilters('sort')}>
            {DiscoverSort.values.map((v, i) => {
              const isSelected = filters.sort === v;
              const label = tFilters(SORT_LABEL_KEYS[v]);
              return (
                <View key={v}>
                  {i > 0 ? <Divider /> : null}
                  <ListCell
                    label={label}
                    onPress={() => {
                      hapticLight();
                      update({ sort: isSelected ? undefined : v });
                    }}
                    chevron={false}
                    rightContent={
                      isSelected ? (
                        <NativeIcon
                          name="checkmark"
                          androidName="check"
                          size={18}
                          color={colors.primary}
                        />
                      ) : null
                    }
                    accessibilityState={{ selected: isSelected, checked: isSelected }}
                  />
                </View>
              );
            })}
          </GroupedSection>

          {/* Location */}
          <GroupedSection header={tFilters('city')}>
            <ListCell
              label={tFilters('city')}
              value={filters.city || tFilters('cityPlaceholder')}
              onPress={openCityPicker}
            />
          </GroupedSection>

          {/* Price range */}
          <GroupedSection header={tFilters('priceRange')}>
            <PriceRow
              label={tFilters('minPrice')}
              value={filters.minPrice}
              placeholder="€ 0"
              onChange={(n) => update({ minPrice: n })}
            />
            <Divider />
            <PriceRow
              label={tFilters('maxPrice')}
              value={filters.maxPrice}
              placeholder="€ ∞"
              onChange={(n) => update({ maxPrice: n })}
            />
          </GroupedSection>

          {/* Property */}
          <GroupedSection header={tFilters('houseType')}>
            {HouseType.values.map((v, i) => {
              const isSelected = filters.houseType === v;
              const label = tEnums(`house_type.${v}`);
              return (
                <View key={v}>
                  {i > 0 ? <Divider /> : null}
                  <ListCell
                    label={label}
                    onPress={() => {
                      hapticLight();
                      update({ houseType: isSelected ? undefined : v });
                    }}
                    chevron={false}
                    rightContent={
                      isSelected ? (
                        <NativeIcon
                          name="checkmark"
                          androidName="check"
                          size={18}
                          color={colors.primary}
                        />
                      ) : null
                    }
                    accessibilityState={{ selected: isSelected, checked: isSelected }}
                  />
                </View>
              );
            })}
          </GroupedSection>

          <GroupedSection header={tFilters('furnishing')}>
            {Furnishing.values.map((v, i) => {
              const isSelected = filters.furnishing === v;
              const label = tEnums(`furnishing.${v}`);
              return (
                <View key={v}>
                  {i > 0 ? <Divider /> : null}
                  <ListCell
                    label={label}
                    onPress={() => {
                      hapticLight();
                      update({ furnishing: isSelected ? undefined : v });
                    }}
                    chevron={false}
                    rightContent={
                      isSelected ? (
                        <NativeIcon
                          name="checkmark"
                          androidName="check"
                          size={18}
                          color={colors.primary}
                        />
                      ) : null
                    }
                    accessibilityState={{ selected: isSelected, checked: isSelected }}
                  />
                </View>
              );
            })}
          </GroupedSection>

          {/* Available from */}
          <GroupedSection header={tFilters('availableFrom')}>
            <View style={styles.dateRow}>
              <ThemedText variant="body" style={styles.dateLabel}>
                {tFilters('availableFrom')}
              </ThemedText>
              <View style={styles.dateActions}>
                <DatePickerSheet
                  value={fromISODate(filters.availableFrom) ?? new Date()}
                  onChange={(d) => update({ availableFrom: toISODate(d) })}
                  title={tFilters('availableFrom')}
                  minimumDate={new Date()}
                />
                {filters.availableFrom ? (
                  <Pressable
                    onPress={() => {
                      hapticLight();
                      update({ availableFrom: undefined });
                    }}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={tFilters('clearFilters')}>
                    <NativeIcon
                      name="xmark.circle.fill"
                      androidName="cancel"
                      size={20}
                      color={colors.tertiaryForeground}
                    />
                  </Pressable>
                ) : null}
              </View>
            </View>
          </GroupedSection>

          {/* Features */}
          <GroupedSection
            header={tFilters('features')}
            footer={
              (filters.features?.length ?? 0) > 0
                ? tFilters('selectedCount', { count: filters.features!.length })
                : undefined
            }>
            {RoomFeature.values.map((v, i) => {
              const isSelected = (filters.features ?? []).includes(v);
              const label = tEnums(`room_feature.${v}`);
              return (
                <View key={v}>
                  {i > 0 ? <Divider /> : null}
                  <ListCell
                    label={label}
                    onPress={() => {
                      hapticLight();
                      toggleArrayItem('features', v);
                    }}
                    chevron={false}
                    rightContent={
                      isSelected ? (
                        <NativeIcon
                          name="checkmark"
                          androidName="check"
                          size={18}
                          color={colors.primary}
                        />
                      ) : null
                    }
                    accessibilityState={{ selected: isSelected, checked: isSelected }}
                  />
                </View>
              );
            })}
          </GroupedSection>

          {/* Location tags */}
          <GroupedSection
            header={tFilters('locationTags')}
            footer={
              (filters.locationTags?.length ?? 0) > 0
                ? tFilters('selectedCount', { count: filters.locationTags!.length })
                : undefined
            }>
            {LocationTag.values.map((v, i) => {
              const isSelected = (filters.locationTags ?? []).includes(v);
              const label = tEnums(`location_tag.${v}`);
              return (
                <View key={v}>
                  {i > 0 ? <Divider /> : null}
                  <ListCell
                    label={label}
                    onPress={() => {
                      hapticLight();
                      toggleArrayItem('locationTags', v);
                    }}
                    chevron={false}
                    rightContent={
                      isSelected ? (
                        <NativeIcon
                          name="checkmark"
                          androidName="check"
                          size={18}
                          color={colors.primary}
                        />
                      ) : null
                    }
                    accessibilityState={{ selected: isSelected, checked: isSelected }}
                  />
                </View>
              );
            })}
          </GroupedSection>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 48,
  },
  groups: {
    paddingTop: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: isIOS ? 44 : 48,
    paddingHorizontal: 16,
    gap: 12,
  },
  priceLabel: {
    width: 56,
  },
  priceInput: {
    flex: 1,
    textAlign: 'right',
    paddingVertical: 0,
    height: isIOS ? 44 : 48,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: isIOS ? 44 : 48,
    paddingHorizontal: 16,
    gap: 12,
  },
  dateLabel: {
    flex: 1,
  },
  dateActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
