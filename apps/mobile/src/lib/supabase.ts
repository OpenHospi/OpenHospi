import { createClient } from '@supabase/supabase-js';

import { EXPO_PUBLIC_SUPABASE_KEY, EXPO_PUBLIC_SUPABASE_URL } from '@/lib/constants';

/**
 * Supabase client configured for Realtime WebSocket only.
 * All data queries go through the Next.js REST API — not directly to Supabase.
 */
export const supabase = createClient(EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_KEY, {
  auth: {
    persistSession: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
