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
export const QUERY_GC_TIME = 1000 * 60 * 30; // 30 minutes (reduced from 24h to prevent memory pressure on mobile)
export const QUERY_RETRY_COUNT = 2;

// Per-query stale time configs
export const STALE_TIMES = {
  chat: 30 * 1000,
  notifications: 30 * 1000,
  verification: 30 * 1000,
  profile: 2 * 60 * 1000,
  settings: 3 * 60 * 1000,
  rooms: 5 * 60 * 1000,
  applications: 5 * 60 * 1000,
  houses: 10 * 60 * 1000,
} as const;

// Mutations that should persist offline (queued and retried when back online)
export const OFFLINE_MUTATIONS = [
  'sendMessage',
  'applyToRoom',
  'uploadProfilePhoto',
  'uploadRoomPhoto',
  'markConversationRead',
] as const;

// ── API Request Timeouts ────────────────────────────────────
export const API_TIMEOUT_MS = 30_000;
export const AUTH_REFRESH_TIMEOUT_MS = 10_000;
