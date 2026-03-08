import { City, Furnishing, HouseType, RoomFeature, LocationTag } from '@openhospi/shared/enums';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  type Option,
} from '@/components/ui/select';
import { Text } from '@/components/ui/text';
import { useDiscoverFilters } from '@/context/discover-filters';
import type { DiscoverFilters } from '@/services/types';

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
    <View className="flex-row flex-wrap gap-2">
      {values.map((v) => {
        const isSelected = selected?.includes(v);
        return (
          <Pressable key={v} onPress={() => onToggle(v)}>
            <Badge
              variant={isSelected ? 'default' : 'outline'}
              className="rounded-full px-3.5 py-2">
              <Text>{t(`${translateKey}.${v}`)}</Text>
            </Badge>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function FilterSheetScreen() {
  const router = useRouter();
  const { t: tEnums } = useTranslation('translation', { keyPrefix: 'enums' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common.labels' });
  const { t: tDiscover } = useTranslation('translation', { keyPrefix: 'app.discover.filters' });

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

  const cityOption: Option | undefined = useMemo(
    () =>
      filters.city ? { value: filters.city, label: tEnums(`city.${filters.city}`) } : undefined,
    [filters.city, tEnums]
  );

  const houseTypeOption: Option | undefined = useMemo(
    () =>
      filters.houseType
        ? { value: filters.houseType, label: tEnums(`house_type.${filters.houseType}`) }
        : undefined,
    [filters.houseType, tEnums]
  );

  const furnishingOption: Option | undefined = useMemo(
    () =>
      filters.furnishing
        ? { value: filters.furnishing, label: tEnums(`furnishing.${filters.furnishing}`) }
        : undefined,
    [filters.furnishing, tEnums]
  );

  return (
    <View className="bg-background flex-1">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled">
        <View className="space-y-4 px-4 pt-4">
          <View className="gap-2">
            <Label>{tCommon('city')}</Label>
            <Select
              value={cityOption}
              onValueChange={(option) => update({ city: option?.value as typeof filters.city })}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder={tCommon('city')} />
              </SelectTrigger>
              <SelectContent>
                {City.values.map((v) => (
                  <SelectItem key={v} value={v} label={tEnums(`city.${v}`)}>
                    {tEnums(`city.${v}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </View>

          <View className="gap-2">
            <Label>{tDiscover('priceRange')}</Label>
            <View className="flex-row gap-3">
              <Input
                className="flex-1 rounded-xl"
                value={filters.minPrice != null ? String(filters.minPrice) : ''}
                onChangeText={(v) => update({ minPrice: v ? Number(v) : undefined })}
                placeholder="Min"
                keyboardType="numeric"
              />
              <Input
                className="flex-1 rounded-xl"
                value={filters.maxPrice != null ? String(filters.maxPrice) : ''}
                onChangeText={(v) => update({ maxPrice: v ? Number(v) : undefined })}
                placeholder="Max"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View className="gap-2">
            <Label>{tDiscover('houseType')}</Label>
            <Select
              value={houseTypeOption}
              onValueChange={(option) =>
                update({ houseType: option?.value as typeof filters.houseType })
              }>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder={tDiscover('houseType')} />
              </SelectTrigger>
              <SelectContent>
                {HouseType.values.map((v) => (
                  <SelectItem key={v} value={v} label={tEnums(`house_type.${v}`)}>
                    {tEnums(`house_type.${v}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </View>

          <View className="gap-2">
            <Label>{tDiscover('furnishing')}</Label>
            <Select
              value={furnishingOption}
              onValueChange={(option) =>
                update({ furnishing: option?.value as typeof filters.furnishing })
              }>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder={tDiscover('furnishing')} />
              </SelectTrigger>
              <SelectContent>
                {Furnishing.values.map((v) => (
                  <SelectItem key={v} value={v} label={tEnums(`furnishing.${v}`)}>
                    {tEnums(`furnishing.${v}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </View>

          <View className="gap-2">
            <Label>{tDiscover('features')}</Label>
            <MultiChipSelect
              values={RoomFeature.values}
              selected={filters.features}
              onToggle={(v) => toggleArrayItem('features', v)}
              translateKey="room_feature"
              t={tEnums}
            />
          </View>

          <View className="mb-8 gap-2">
            <Label>{tDiscover('locationTags')}</Label>
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

      <View className="border-border border-t px-4 pt-3 pb-6">
        <View className="gap-2">
          <Button className="h-14 rounded-xl" onPress={handleApply}>
            <Text>{tCommon('apply')}</Text>
          </Button>
          <Button variant="ghost" onPress={handleClear}>
            <Text className="text-primary">{tCommon('reset')}</Text>
          </Button>
        </View>
      </View>
    </View>
  );
}
