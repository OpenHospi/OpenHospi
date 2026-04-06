import { useEffect, useSyncExternalStore } from 'react';
import { addNetworkStateListener, getNetworkStateAsync, type NetworkState } from 'expo-network';
import { onlineManager } from '@tanstack/react-query';

// ── Network state store ─────────────────────────────────────
// Singleton that tracks connectivity and notifies subscribers.

type NetworkStatus = {
  isOnline: boolean;
  isInternetReachable: boolean;
};

let currentStatus: NetworkStatus = {
  isOnline: true,
  isInternetReachable: true,
};

const listeners = new Set<() => void>();
const restoreCallbacks = new Set<() => void>();

function notifyListeners() {
  for (const listener of listeners) {
    listener();
  }
}

function updateStatus(state: NetworkState) {
  const wasOnline = currentStatus.isOnline;
  const isOnline = state.isConnected ?? false;
  const isInternetReachable = state.isInternetReachable ?? isOnline;

  currentStatus = { isOnline, isInternetReachable };
  notifyListeners();

  // Fire restore callbacks when transitioning from offline to online
  // Debounced to prevent query floods on rapid WiFi reconnections
  if (!wasOnline && isOnline) {
    fireRestoreCallbacks();
  }
}

let restoreDebounceTimer: ReturnType<typeof setTimeout> | null = null;

function fireRestoreCallbacks() {
  if (restoreDebounceTimer) clearTimeout(restoreDebounceTimer);
  restoreDebounceTimer = setTimeout(() => {
    for (const cb of restoreCallbacks) {
      cb();
    }
    restoreDebounceTimer = null;
  }, 200);
}

// ── Initialization ──────────────────────────────────────────
// Called once from root layout to start monitoring.

let initialized = false;

export function initializeNetworkManager() {
  if (initialized) return;
  initialized = true;

  // Sync initial state
  getNetworkStateAsync().then(updateStatus);

  // Listen for changes
  addNetworkStateListener(updateStatus);

  // Integrate with React Query's onlineManager so queries
  // automatically pause when offline and resume when online.
  onlineManager.setEventListener((setOnline) => {
    const subscription = addNetworkStateListener((state) => {
      setOnline(state.isConnected ?? false);
    });
    return () => subscription.remove();
  });
}

// ── Public API ──────────────────────────────────────────────

export function getNetworkStatus(): NetworkStatus {
  return currentStatus;
}

export function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

/**
 * Register a callback that fires when the device transitions
 * from offline to online. Used by Supabase reconnection and
 * session refresh to act on network restore.
 */
export function onNetworkRestore(callback: () => void): () => void {
  restoreCallbacks.add(callback);
  return () => restoreCallbacks.delete(callback);
}

// ── React hook ──────────────────────────────────────────────

export function useNetworkStatus(): NetworkStatus {
  const status = useSyncExternalStore(subscribe, getNetworkStatus, getNetworkStatus);

  // Initialize on first render if not already done
  useEffect(() => {
    initializeNetworkManager();
  }, []);

  return status;
}
