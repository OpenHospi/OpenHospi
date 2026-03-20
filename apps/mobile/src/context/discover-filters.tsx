import { createContext, useContext, useState } from 'react';

import type { DiscoverFilters } from '@openhospi/shared/api-types';

type DiscoverFiltersContextValue = {
  filters: DiscoverFilters;
  setFilters: (filters: DiscoverFilters) => void;
};

const DiscoverFiltersContext = createContext<DiscoverFiltersContextValue>({
  filters: {},
  setFilters: () => {},
});

export function DiscoverFiltersProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useState<DiscoverFilters>({});

  return (
    <DiscoverFiltersContext.Provider value={{ filters, setFilters }}>
      {children}
    </DiscoverFiltersContext.Provider>
  );
}

export function useDiscoverFilters() {
  return useContext(DiscoverFiltersContext);
}
