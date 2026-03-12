import Constants from 'expo-constants';

// ── Environment ──────────────────────────────────────────────
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://openhospi.nl';
export const EXPO_PUBLIC_SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
export const EXPO_PUBLIC_SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_KEY ?? '';
export const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

// ── App Config (from expo-constants) ─────────────────────────
const expoConfig = Constants.expoConfig;
export const APP_SCHEME = (expoConfig?.scheme as string) ?? 'openhospi';
export const APP_VERSION = expoConfig?.version ?? '1.0.0';

// ── Storage Keys ─────────────────────────────────────────────
export const STORAGE_PREFIX = 'openhospi';
export const LOCALE_STORAGE_KEY = 'user-locale';

// ── Local Database ───────────────────────────────────────────
export const DATABASE_NAME = 'openhospi.db';

// ── React Query ──────────────────────────────────────────────
export const QUERY_STALE_TIME = 1000 * 60 * 5;
export const QUERY_GC_TIME = 1000 * 60 * 30;
export const QUERY_RETRY_COUNT = 2;
