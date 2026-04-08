import { createContext, useContext, useState } from 'react';

import type { DiscoverFilters } from '@openhospi/shared/api-types';

import { mmkv } from '@/lib/mmkv';

const FILTERS_KEY = 'discover_filters';

type DiscoverFiltersContextValue = {
  filters: DiscoverFilters;
  setFilters: (filters: DiscoverFilters) => void;
  activeFilterCount: number;
  resetFilters: () => void;
};

const DiscoverFiltersContext = createContext<DiscoverFiltersContextValue>({
  filters: {},
  setFilters: () => {},
  activeFilterCount: 0,
  resetFilters: () => {},
});

export function DiscoverFiltersProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFiltersState] = useState<DiscoverFilters>(
    () => mmkv.getObject<DiscoverFilters>(FILTERS_KEY) ?? {}
  );

  function setFilters(next: DiscoverFilters) {
    setFiltersState(next);
    mmkv.setObject(FILTERS_KEY, next);
  }

  function resetFilters() {
    setFiltersState({});
    mmkv.delete(FILTERS_KEY);
  }

  const activeFilterCount = Object.values(filters).filter(
    (v) => v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && v.length === 0)
  ).length;

  return (
    <DiscoverFiltersContext.Provider
      value={{ filters, setFilters, activeFilterCount, resetFilters }}>
      {children}
    </DiscoverFiltersContext.Provider>
  );
}

export function useDiscoverFilters() {
  return useContext(DiscoverFiltersContext);
}
