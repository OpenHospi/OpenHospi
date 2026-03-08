import { City, Furnishing, HouseType, RoomFeature, LocationTag } from '@openhospi/shared/enums';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { useTranslation } from 'react-i18next';
import type { DiscoverFilters } from '@/services/types';

type Props = {
  visible: boolean;
  onClose: () => void;
  filters: DiscoverFilters;
  onApply: (filters: DiscoverFilters) => void;
};

function ChipSelect({
  values,
  selected,
  onToggle,
  translateKey,
  t,
  multi,
}: {
  values: readonly string[];
  selected: string | string[] | undefined;
  onToggle: (v: string) => void;
  translateKey: string;
  t: (key: string) => string;
  multi?: boolean;
}) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {values.map((v) => {
        const isSelected = multi ? (selected as string[] | undefined)?.includes(v) : selected === v;
        return (
          <Pressable
            key={v}
            className={`rounded-lg border px-3 py-1.5 ${isSelected ? 'border-primary bg-primary/10' : 'border-border'}`}
            onPress={() => onToggle(v)}
          >
            <Text
              className={`text-sm ${isSelected ? 'font-semibold text-primary' : 'text-foreground'}`}
            >
              {t(`${translateKey}.${v}`)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function FilterSheet({ visible, onClose, filters: initialFilters, onApply }: Props) {
  const { t: tEnums } = useTranslation('translation', { keyPrefix: 'enums' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });
  const { t: tDiscover } = useTranslation('translation', { keyPrefix: 'app.discover.filters' });

  const [filters, setFilters] = useState<DiscoverFilters>(initialFilters);

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

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-background">
        <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
          <Pressable onPress={onClose}>
            <Text className="text-base text-muted-foreground">{tCommon('close')}</Text>
          </Pressable>
          <Text className="text-base font-semibold text-foreground">{tDiscover('title')}</Text>
          <Pressable onPress={handleClear}>
            <Text className="text-base text-primary">{tCommon('reset')}</Text>
          </Pressable>
        </View>

        <ScrollView className="flex-1 px-4 pt-4">
          <Text className="text-sm font-medium text-foreground">{tCommon('city')}</Text>
          <View className="mt-1">
            <ChipSelect
              values={City.values}
              selected={filters.city}
              onToggle={(v) =>
                update({ city: filters.city === v ? undefined : (v as typeof filters.city) })
              }
              translateKey="city"
              t={tEnums}
            />
          </View>

          <Text className="mt-4 text-sm font-medium text-foreground">
            {tDiscover('priceRange')}
          </Text>
          <View className="mt-1 flex-row gap-3">
            <TextInput
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-foreground"
              value={filters.minPrice != null ? String(filters.minPrice) : ''}
              onChangeText={(v) => update({ minPrice: v ? Number(v) : undefined })}
              placeholder="Min"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
            <TextInput
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-foreground"
              value={filters.maxPrice != null ? String(filters.maxPrice) : ''}
              onChangeText={(v) => update({ maxPrice: v ? Number(v) : undefined })}
              placeholder="Max"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
          </View>

          <Text className="mt-4 text-sm font-medium text-foreground">{tDiscover('houseType')}</Text>
          <View className="mt-1">
            <ChipSelect
              values={HouseType.values}
              selected={filters.houseType}
              onToggle={(v) =>
                update({
                  houseType: filters.houseType === v ? undefined : (v as typeof filters.houseType),
                })
              }
              translateKey="house_type"
              t={tEnums}
            />
          </View>

          <Text className="mt-4 text-sm font-medium text-foreground">
            {tDiscover('furnishing')}
          </Text>
          <View className="mt-1">
            <ChipSelect
              values={Furnishing.values}
              selected={filters.furnishing}
              onToggle={(v) =>
                update({
                  furnishing:
                    filters.furnishing === v ? undefined : (v as typeof filters.furnishing),
                })
              }
              translateKey="furnishing"
              t={tEnums}
            />
          </View>

          <Text className="mt-4 text-sm font-medium text-foreground">{tDiscover('features')}</Text>
          <View className="mt-1">
            <ChipSelect
              values={RoomFeature.values}
              selected={filters.features}
              onToggle={(v) => toggleArrayItem('features', v)}
              translateKey="room_feature"
              t={tEnums}
              multi
            />
          </View>

          <Text className="mt-4 text-sm font-medium text-foreground">
            {tDiscover('locationTags')}
          </Text>
          <View className="mb-8 mt-1">
            <ChipSelect
              values={LocationTag.values}
              selected={filters.locationTags}
              onToggle={(v) => toggleArrayItem('locationTags', v)}
              translateKey="location_tag"
              t={tEnums}
              multi
            />
          </View>
        </ScrollView>

        <View className="border-t border-border px-4 py-3">
          <Pressable
            className="items-center rounded-xl bg-primary py-3.5 active:opacity-80"
            onPress={() => {
              onApply(filters);
              onClose();
            }}
          >
            <Text className="text-base font-semibold text-primary-foreground">
              {tCommon('apply')}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
