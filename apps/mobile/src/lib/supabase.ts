import { useSyncExternalStore } from 'react';
import { createClient, type RealtimeChannel } from '@supabase/supabase-js';

import { EXPO_PUBLIC_SUPABASE_KEY, EXPO_PUBLIC_SUPABASE_URL } from '@/lib/constants';
import { onForeground, onBackground } from '@/lib/app-lifecycle';
import { onNetworkRestore } from '@/lib/network';
import { queryClient } from '@/lib/query-client';

// ── Supabase Client ─────────────────────────────────────────
// Configured for Realtime WebSocket only.
// All data queries go through the Next.js REST API.

export const supabase = createClient(EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_KEY, {
  auth: {
    persistSession: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
    heartbeatIntervalMs: 15_000,
  },
});

// ── Connection State Tracking ───────────────────────────────

type ConnectionStatus = 'connected' | 'reconnecting' | 'disconnected';

let currentStatus: ConnectionStatus = 'disconnected';
const statusListeners = new Set<() => void>();

function setConnectionStatus(status: ConnectionStatus) {
  if (currentStatus === status) return;
  currentStatus = status;
  for (const listener of statusListeners) {
    listener();
  }
}

function subscribeStatus(callback: () => void): () => void {
  statusListeners.add(callback);
  return () => statusListeners.delete(callback);
}

function getConnectionStatus(): ConnectionStatus {
  return currentStatus;
}

export function useRealtimeStatus(): ConnectionStatus {
  return useSyncExternalStore(subscribeStatus, getConnectionStatus, getConnectionStatus);
}

// ── Managed Channel Registry ────────────────────────────────

type ChannelSetup = {
  name: string;
  configure: (channel: RealtimeChannel) => RealtimeChannel;
};

const activeChannels = new Map<string, { setup: ChannelSetup; channel: RealtimeChannel }>();

export function subscribeToChannel(setup: ChannelSetup): () => void {
  unsubscribeFromChannel(setup.name);

  const channel = setup.configure(supabase.channel(setup.name));
  channel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      reconnectAttempts = 0; // Reset backoff on successful connection
      setConnectionStatus('connected');
    } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
      setConnectionStatus('reconnecting');
    } else if (status === 'CLOSED') {
      // Check if this was the last active channel
      activeChannels.delete(setup.name);
      if (activeChannels.size === 0) {
        setConnectionStatus('disconnected');
      }
    }
  });

  activeChannels.set(setup.name, { setup, channel });

  return () => unsubscribeFromChannel(setup.name);
}

export function unsubscribeFromChannel(name: string): void {
  const entry = activeChannels.get(name);
  if (entry) {
    supabase.removeChannel(entry.channel);
    activeChannels.delete(name);

    if (activeChannels.size === 0) {
      setConnectionStatus('disconnected');
    }
  }
}

// ── Reconnection with Exponential Backoff ───────────────────

let reconnectAttempts = 0;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

function getBackoffDelay(): number {
  const delay = Math.min(100 * Math.pow(2, reconnectAttempts), 30_000);
  const jitter = Math.random() * 100;
  return delay + jitter;
}

function reconnectAllChannels() {
  if (activeChannels.size === 0) return;
  if (reconnectTimer) return; // Already scheduled

  const delay = reconnectAttempts === 0 ? 0 : getBackoffDelay();

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;

    if (activeChannels.size === 0) return;
    setConnectionStatus('reconnecting');

    const entries = [...activeChannels.entries()];
    for (const [name, { setup }] of entries) {
      supabase.removeChannel(activeChannels.get(name)!.channel);

      const newChannel = setup.configure(supabase.channel(setup.name));
      newChannel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          reconnectAttempts = 0;
          setConnectionStatus('connected');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setConnectionStatus('reconnecting');
        }
      });

      activeChannels.set(name, { setup, channel: newChannel });
    }

    reconnectAttempts++;

    // Invalidate chat queries to catch up on missed messages
    queryClient.invalidateQueries({ queryKey: ['chat'] });
  }, delay);
}

function disconnectAllChannels() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  reconnectAttempts = 0;

  for (const [, { channel }] of activeChannels) {
    channel.unsubscribe();
  }
  setConnectionStatus('disconnected');
}

// ── Lifecycle Integration ───────────────────────────────────

onForeground(() => {
  reconnectAllChannels();
});

onBackground(() => {
  disconnectAllChannels();
});

onNetworkRestore(() => {
  reconnectAllChannels();
});
