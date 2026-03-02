"use client";

import {
  City,
  DiscoverSort,
  Furnishing,
  HouseType,
  LocationTag,
  RoomFeature,
} from "@openhospi/shared/enums";
import { SlidersHorizontal, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePathname, useRouter } from "@/i18n/navigation-app";
import type { DiscoverFilters } from "@/lib/discover";
import { cn } from "@/lib/utils";

type FilterValue = string | string[] | undefined;

type DiscoverFilterProps = {
  filters: DiscoverFilters;
  sort: DiscoverSort;
};

export function DiscoverFiltersPanel({ filters, sort }: DiscoverFilterProps) {
  const t = useTranslations("app.discover.filters");
  const tEnums = useTranslations("enums");
  const router = useRouter();
  const pathname = usePathname();

  const [showFilters, setShowFilters] = useState(false);
  const [minPrice, setMinPrice] = useState(filters.minPrice?.toString() ?? "");
  const [maxPrice, setMaxPrice] = useState(filters.maxPrice?.toString() ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const buildParams = useCallback(
    (overrides: Record<string, FilterValue>) => {
      const params = new URLSearchParams();

      const values: Record<string, FilterValue> = {
        city: filters.city,
        minPrice: filters.minPrice?.toString(),
        maxPrice: filters.maxPrice?.toString(),
        houseType: filters.houseType,
        furnishing: filters.furnishing,
        availableFrom: filters.availableFrom,
        features: filters.features,
        locationTags: filters.locationTags,
        sort: sort !== DiscoverSort.newest ? sort : undefined,
        ...overrides,
      };

      // Remove page when filters change
      for (const [key, val] of Object.entries(values)) {
        if (val === undefined || val === "") continue;
        if (Array.isArray(val) && val.length > 0) {
          params.set(key, val.join(","));
        } else if (typeof val === "string") {
          params.set(key, val);
        }
      }

      const qs = params.toString();
      return qs ? `${pathname}?${qs}` : pathname;
    },
    [filters, sort, pathname],
  );

  const updateFilter = useCallback(
    (key: string, value: string | string[] | undefined) => {
      router.replace(buildParams({ [key]: value, page: undefined }), { scroll: false });
    },
    [router, buildParams],
  );

  const debouncedPriceUpdate = useCallback(
    (key: "minPrice" | "maxPrice", value: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        updateFilter(key, value || undefined);
      }, 500);
    },
    [updateFilter],
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const hasFilters =
    filters.city ||
    filters.minPrice != null ||
    filters.maxPrice != null ||
    filters.houseType ||
    filters.furnishing ||
    filters.availableFrom ||
    (filters.features && filters.features.length > 0) ||
    (filters.locationTags && filters.locationTags.length > 0);

  const clearAll = () => {
    setMinPrice("");
    setMaxPrice("");
    const params = new URLSearchParams();
    if (sort !== DiscoverSort.newest) params.set("sort", sort);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  return (
    <div className="space-y-4">
      {/* Header row: sort + mobile toggle */}
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={sort}
          onValueChange={(v) => updateFilter("sort", v === DiscoverSort.newest ? undefined : v)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder={t("sort")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">{t("sortNewest")}</SelectItem>
            <SelectItem value="cheapest">{t("sortCheapest")}</SelectItem>
            <SelectItem value="most_expensive">{t("sortMostExpensive")}</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          className="md:hidden"
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal className="size-4" />
          {showFilters ? t("hideFilters") : t("showFilters")}
        </Button>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearAll}>
            <X className="size-4" />
            {t("clearFilters")}
          </Button>
        )}
      </div>

      {/* Filter grid */}
      <div
        className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-4", !showFilters && "hidden md:grid")}
      >
        {/* City */}
        <div className="space-y-1.5">
          <Label>{t("city")}</Label>
          <Combobox
            value={filters.city ?? null}
            onValueChange={(v) => updateFilter("city", v ?? undefined)}
            items={City.values}
            itemToStringLabel={(city: City) => tEnums(`city.${city}`)}
          >
            <ComboboxInput placeholder={t("cityPlaceholder")} showClear />
            <ComboboxContent>
              <ComboboxEmpty>{t("cityPlaceholder")}</ComboboxEmpty>
              <ComboboxList>
                {(city: City) => (
                  <ComboboxItem key={city} value={city}>
                    {tEnums(`city.${city}`)}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </div>

        {/* Min price */}
        <div className="space-y-1.5">
          <Label>{t("minPrice")}</Label>
          <Input
            type="number"
            min={0}
            placeholder="€0"
            value={minPrice}
            onChange={(e) => {
              setMinPrice(e.target.value);
              debouncedPriceUpdate("minPrice", e.target.value);
            }}
          />
        </div>

        {/* Max price */}
        <div className="space-y-1.5">
          <Label>{t("maxPrice")}</Label>
          <Input
            type="number"
            min={0}
            placeholder="€∞"
            value={maxPrice}
            onChange={(e) => {
              setMaxPrice(e.target.value);
              debouncedPriceUpdate("maxPrice", e.target.value);
            }}
          />
        </div>

        {/* House type */}
        <div className="space-y-1.5">
          <Label>{t("houseType")}</Label>
          <Select
            value={filters.houseType ?? "all"}
            onValueChange={(v) => updateFilter("houseType", v === "all" ? undefined : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("houseTypePlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("houseTypePlaceholder")}</SelectItem>
              {HouseType.values.map((ht) => (
                <SelectItem key={ht} value={ht}>
                  {tEnums(`house_type.${ht}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Furnishing */}
        <div className="space-y-1.5">
          <Label>{t("furnishing")}</Label>
          <Select
            value={filters.furnishing ?? "all"}
            onValueChange={(v) => updateFilter("furnishing", v === "all" ? undefined : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("furnishingPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("furnishingPlaceholder")}</SelectItem>
              {Furnishing.values.map((f) => (
                <SelectItem key={f} value={f}>
                  {tEnums(`furnishing.${f}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Available from */}
        <div className="space-y-1.5">
          <Label>{t("availableFrom")}</Label>
          <Input
            type="date"
            value={filters.availableFrom ?? ""}
            onChange={(e) => updateFilter("availableFrom", e.target.value || undefined)}
          />
        </div>

        {/* Features multi-select */}
        <div className="space-y-1.5">
          <Label>{t("features")}</Label>
          <MultiSelect
            values={filters.features ?? []}
            options={RoomFeature.values as unknown as string[]}
            placeholder={t("featuresPlaceholder")}
            renderLabel={(v) => tEnums(`room_feature.${v as RoomFeature}`)}
            onChange={(v) => updateFilter("features", v.length > 0 ? v : undefined)}
            selectedCountLabel={(count) => t("selectedCount", { count: String(String(count)) })}
          />
        </div>

        {/* Location tags multi-select */}
        <div className="space-y-1.5">
          <Label>{t("locationTags")}</Label>
          <MultiSelect
            values={filters.locationTags ?? []}
            options={LocationTag.values as unknown as string[]}
            placeholder={t("locationTagsPlaceholder")}
            renderLabel={(v) => tEnums(`location_tag.${v as LocationTag}`)}
            onChange={(v) => updateFilter("locationTags", v.length > 0 ? v : undefined)}
            selectedCountLabel={(count) => t("selectedCount", { count: String(String(count)) })}
          />
        </div>
      </div>
    </div>
  );
}

function MultiSelect({
  values,
  options,
  placeholder,
  renderLabel,
  onChange,
}: {
  values: string[];
  options: string[];
  placeholder: string;
  renderLabel: (value: string) => string;
  onChange: (values: string[]) => void;
  selectedCountLabel: (count: number) => string;
}) {
  const anchor = useComboboxAnchor();

  return (
    <Combobox
      multiple
      value={values}
      onValueChange={onChange}
      items={options}
      itemToStringLabel={renderLabel}
    >
      <ComboboxChips ref={anchor}>
        {values.map((item) => (
          <ComboboxChip key={item}>{renderLabel(item)}</ComboboxChip>
        ))}
        <ComboboxChipsInput placeholder={values.length === 0 ? placeholder : ""} />
      </ComboboxChips>
      <ComboboxContent anchor={anchor}>
        <ComboboxEmpty>{placeholder}</ComboboxEmpty>
        <ComboboxList>
          {(option) => (
            <ComboboxItem key={option} value={option}>
              {renderLabel(option)}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
