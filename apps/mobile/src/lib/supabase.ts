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
// Tracks active subscriptions so they can be reconnected
// after network restore or foreground return.

type ChannelSetup = {
  name: string;
  configure: (channel: RealtimeChannel) => RealtimeChannel;
};

const activeChannels = new Map<string, { setup: ChannelSetup; channel: RealtimeChannel }>();

/**
 * Subscribe to a managed Realtime channel. The channel will be
 * automatically reconnected when the app returns to foreground
 * or network is restored.
 *
 * Returns an unsubscribe function that removes the channel.
 */
export function subscribeToChannel(setup: ChannelSetup): () => void {
  // Remove existing channel with same name if any
  unsubscribeFromChannel(setup.name);

  const channel = setup.configure(supabase.channel(setup.name));
  channel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      setConnectionStatus('connected');
    } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
      setConnectionStatus('reconnecting');
    } else if (status === 'CLOSED') {
      // Only set disconnected if no other channels are active
      if (activeChannels.size <= 1) {
        setConnectionStatus('disconnected');
      }
    }
  });

  activeChannels.set(setup.name, { setup, channel });

  return () => unsubscribeFromChannel(setup.name);
}

/**
 * Remove a managed channel by name.
 */
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

// ── Reconnection Logic ──────────────────────────────────────

function reconnectAllChannels() {
  if (activeChannels.size === 0) return;

  setConnectionStatus('reconnecting');

  // Re-create each channel from its setup function
  const entries = [...activeChannels.entries()];
  for (const [name, { setup }] of entries) {
    // Remove old channel
    supabase.removeChannel(activeChannels.get(name)!.channel);

    // Create fresh channel with same configuration
    const newChannel = setup.configure(supabase.channel(setup.name));
    newChannel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        setConnectionStatus('connected');
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        setConnectionStatus('reconnecting');
      }
    });

    activeChannels.set(name, { setup, channel: newChannel });
  }

  // Invalidate chat queries to catch up on missed messages
  queryClient.invalidateQueries({ queryKey: ['chat'] });
}

function disconnectAllChannels() {
  for (const [, { channel }] of activeChannels) {
    channel.unsubscribe();
  }
  setConnectionStatus('disconnected');
}

// ── Lifecycle Integration ───────────────────────────────────
// Reconnect on foreground return and network restore.
// Disconnect after background delay (handled by app-lifecycle).

onForeground(() => {
  reconnectAllChannels();
});

onBackground(() => {
  disconnectAllChannels();
});

onNetworkRestore(() => {
  reconnectAllChannels();
});
