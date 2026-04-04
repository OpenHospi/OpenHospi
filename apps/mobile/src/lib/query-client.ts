import { AppState, Platform } from 'react-native';
import type { AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient, focusManager, type Mutation, type Query } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

import { APP_VERSION, QUERY_RETRY_COUNT, QUERY_GC_TIME, QUERY_STALE_TIME } from '@/lib/constants';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: QUERY_STALE_TIME,
      gcTime: QUERY_GC_TIME,
      retry: QUERY_RETRY_COUNT,
      networkMode: 'offlineFirst',
      refetchOnWindowFocus: false,
    },
    mutations: {
      gcTime: QUERY_GC_TIME,
      networkMode: 'offlineFirst',
    },
  },
});

// ── Focus Manager ───────────────────────────────────────────
// Auto-refetch stale queries when app returns to foreground.

function handleAppStateChange(status: AppStateStatus) {
  if (Platform.OS !== 'web') {
    focusManager.setFocused(status === 'active');
  }
}

AppState.addEventListener('change', handleAppStateChange);

// ── Cache Persister ─────────────────────────────────────────
// Persists the query cache to AsyncStorage so data survives
// app restarts. Uses APP_VERSION as buster to clear cache on
// app updates. E2EE-sensitive keys are excluded.

const CHAT_MESSAGE_KEY_PREFIX = 'chat';

export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'openhospi-query-cache',
  throttleTime: 1000,
});

export const persistOptions = {
  persister: asyncStoragePersister,
  buster: APP_VERSION,
  maxAge: QUERY_GC_TIME,
  dehydrateOptions: {
    shouldDehydrateQuery: (query: Query) => {
      // Exclude chat message queries from persistence — these are
      // cached in the local SQLite `localMessages` table instead.
      // This prevents storing decrypted plaintext in AsyncStorage.
      const firstKey = query.queryKey[0];
      if (typeof firstKey === 'string' && firstKey.startsWith(CHAT_MESSAGE_KEY_PREFIX)) {
        return false;
      }
      return true;
    },
    shouldDehydrateMutation: (mutation: Mutation) => {
      // Only persist chat send mutations (they store encrypted payloads)
      const firstKey = mutation.options.mutationKey?.[0];
      return typeof firstKey === 'string' && firstKey === 'sendMessage';
    },
  },
};
