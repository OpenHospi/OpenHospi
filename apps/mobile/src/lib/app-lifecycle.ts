import { useEffect, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import type { AppStateStatus } from 'react-native';
import * as Sentry from '@sentry/react-native';

// ── App Lifecycle Manager ───────────────────────────────────
// Central manager for foreground/background transitions.
// Coordinates session refresh, Supabase reconnection, and
// query refetch across the app.

type AppLifecycleState = 'active' | 'background' | 'inactive';

type ForegroundCallback = () => void;
type BackgroundCallback = () => void;

let currentState: AppLifecycleState = AppState.currentState as AppLifecycleState;

const listeners = new Set<() => void>();
const foregroundCallbacks = new Set<ForegroundCallback>();
const backgroundCallbacks = new Set<BackgroundCallback>();

let backgroundTimerId: ReturnType<typeof setTimeout> | null = null;

const BACKGROUND_DELAY_MS = 30_000; // 30s delay before firing background callbacks

function notifyListeners() {
  for (const listener of listeners) {
    listener();
  }
}

function handleAppStateChange(nextState: AppStateStatus) {
  const prevState = currentState;
  currentState = nextState as AppLifecycleState;
  notifyListeners();

  // Foreground: app became active from background/inactive
  if (nextState === 'active' && prevState !== 'active') {
    // Cancel pending background disconnect
    if (backgroundTimerId !== null) {
      clearTimeout(backgroundTimerId);
      backgroundTimerId = null;
    }

    for (const cb of foregroundCallbacks) {
      try {
        cb();
      } catch (error) {
        Sentry.captureException(error, { tags: { context: 'app-lifecycle-foreground' } });
      }
    }
  }

  // Background: app left foreground
  if (nextState !== 'active' && prevState === 'active') {
    // Delay background callbacks to allow quick resume without
    // unnecessary disconnection/reconnection churn
    backgroundTimerId = setTimeout(() => {
      backgroundTimerId = null;
      // Only fire if still in background
      if (currentState !== 'active') {
        for (const cb of backgroundCallbacks) {
          try {
            cb();
          } catch (error) {
            Sentry.captureException(error, { tags: { context: 'app-lifecycle-background' } });
          }
        }
      }
    }, BACKGROUND_DELAY_MS);
  }
}

// ── Initialization ──────────────────────────────────────────

let initialized = false;

export function initializeAppLifecycle() {
  if (initialized) return;
  initialized = true;
  AppState.addEventListener('change', handleAppStateChange);
}

// ── Public API ──────────────────────────────────────────────

export function getAppLifecycleState(): AppLifecycleState {
  return currentState;
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

/**
 * Register a callback that fires when the app returns to the foreground.
 * Used by session refresh, Supabase reconnection, etc.
 */
export function onForeground(callback: ForegroundCallback): () => void {
  foregroundCallbacks.add(callback);
  return () => foregroundCallbacks.delete(callback);
}

/**
 * Register a callback that fires 30s after the app enters the background.
 * Used by Supabase to disconnect and save battery.
 */
export function onBackground(callback: BackgroundCallback): () => void {
  backgroundCallbacks.add(callback);
  return () => backgroundCallbacks.delete(callback);
}

// ── React hook ──────────────────────────────────────────────

export function useAppLifecycle(): AppLifecycleState {
  const state = useSyncExternalStore(subscribe, getAppLifecycleState, getAppLifecycleState);

  useEffect(() => {
    initializeAppLifecycle();
  }, []);

  return state;
}
