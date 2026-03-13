/**
 * Composite mobile Signal protocol store backed by SQLite.
 * Combines all store interfaces into a single SignalProtocolStore instance.
 */
import type { SignalProtocolStore } from '@openhospi/crypto/stores';

import { createSqliteIdentityStore } from './SqliteIdentityStore';
import { createSqlitePreKeyStore } from './SqlitePreKeyStore';
import { createSqliteSessionStore } from './SqliteSessionStore';
import { createSqliteSenderKeyStore } from './SqliteSenderKeyStore';

export type { SignalProtocolStore } from '@openhospi/crypto/stores';

export type MobileSignalStore = SignalProtocolStore & {
  storeIdentityKeyPair: ReturnType<typeof createSqliteIdentityStore>['storeIdentityKeyPair'];
};

let instance: MobileSignalStore | null = null;

/**
 * Get or create the mobile Signal protocol store singleton.
 * All private key material is encrypted with a master key stored in expo-secure-store.
 */
export function getMobileSignalStore(): MobileSignalStore {
  if (instance) return instance;

  const identity = createSqliteIdentityStore();
  const preKey = createSqlitePreKeyStore();
  const session = createSqliteSessionStore();
  const senderKey = createSqliteSenderKeyStore();

  instance = {
    // Identity
    getIdentityKeyPair: identity.getIdentityKeyPair,
    getLocalRegistrationId: identity.getLocalRegistrationId,
    saveIdentity: identity.saveIdentity,
    isTrustedIdentity: identity.isTrustedIdentity,
    storeIdentityKeyPair: identity.storeIdentityKeyPair,

    // Pre Keys
    loadPreKey: preKey.loadPreKey,
    storePreKey: preKey.storePreKey,
    removePreKey: preKey.removePreKey,
    getAvailablePreKeyCount: preKey.getAvailablePreKeyCount,

    // Signed Pre Keys
    loadSignedPreKey: preKey.loadSignedPreKey,
    storeSignedPreKey: preKey.storeSignedPreKey,

    // Sessions
    loadSession: session.loadSession,
    storeSession: session.storeSession,
    deleteSession: session.deleteSession,
    getSubDeviceSessions: session.getSubDeviceSessions,

    // Sender Keys
    storeSenderKey: senderKey.storeSenderKey,
    loadSenderKey: senderKey.loadSenderKey,
    deleteSenderKey: senderKey.deleteSenderKey,

    // Skipped Keys
    loadSkippedKeys: session.loadSkippedKeys,
    storeSkippedKeys: session.storeSkippedKeys,
    deleteSkippedKeys: session.deleteSkippedKeys,
  };

  return instance;
}
