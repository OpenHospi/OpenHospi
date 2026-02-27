"use client";

import {
  CITIES,
  DiscoverSort,
  FURNISHINGS,
  HOUSE_TYPES,
  LOCATION_TAGS,
  ROOM_FEATURES,
} from "@openhospi/shared/enums";
import { Check, ChevronsUpDown, SlidersHorizontal, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
          <Select
            value={filters.city ?? "all"}
            onValueChange={(v) => updateFilter("city", v === "all" ? undefined : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("cityPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("cityPlaceholder")}</SelectItem>
              {CITIES.map((city) => (
                <SelectItem key={city} value={city}>
                  {tEnums(`city.${city}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
              {HOUSE_TYPES.map((ht) => (
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
              {FURNISHINGS.map((f) => (
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
            options={ROOM_FEATURES as unknown as string[]}
            placeholder={t("featuresPlaceholder")}
            renderLabel={(v) => tEnums(`room_feature.${v}`)}
            onChange={(v) => updateFilter("features", v.length > 0 ? v : undefined)}
            selectedCountLabel={(count) => t("selectedCount", { count })}
          />
        </div>

        {/* Location tags multi-select */}
        <div className="space-y-1.5">
          <Label>{t("locationTags")}</Label>
          <MultiSelect
            values={filters.locationTags ?? []}
            options={LOCATION_TAGS as unknown as string[]}
            placeholder={t("locationTagsPlaceholder")}
            renderLabel={(v) => tEnums(`location_tag.${v}`)}
            onChange={(v) => updateFilter("locationTags", v.length > 0 ? v : undefined)}
            selectedCountLabel={(count) => t("selectedCount", { count })}
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
  selectedCountLabel,
}: {
  values: string[];
  options: string[];
  placeholder: string;
  renderLabel: (value: string) => string;
  onChange: (values: string[]) => void;
  selectedCountLabel: (count: number) => string;
}) {
  const [open, setOpen] = useState(false);

  const toggle = (value: string) => {
    if (values.includes(value)) {
      onChange(values.filter((v) => v !== value));
    } else {
      onChange([...values, value]);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
          {values.length > 0 ? (
            <span className="flex items-center gap-1">
              <Badge variant="secondary" className="text-xs">
                {selectedCountLabel(values.length)}
              </Badge>
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0" align="start">
        <Command>
          <CommandInput placeholder={placeholder} />
          <CommandList>
            <CommandEmpty>No results.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem key={option} value={option} onSelect={() => toggle(option)}>
                  <Check
                    className={cn("size-4", values.includes(option) ? "opacity-100" : "opacity-0")}
                  />
                  {renderLabel(option)}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
