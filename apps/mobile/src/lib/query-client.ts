import { QueryClient } from '@tanstack/react-query';

import { QUERY_GC_TIME, QUERY_RETRY_COUNT, QUERY_STALE_TIME } from '@/lib/constants';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: QUERY_STALE_TIME,
      gcTime: QUERY_GC_TIME,
      retry: QUERY_RETRY_COUNT,
      refetchOnWindowFocus: false,
    },
  },
});
