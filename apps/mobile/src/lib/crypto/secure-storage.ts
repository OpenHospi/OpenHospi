import * as SecureStoreModule from 'expo-secure-store';

/**
 * Wrapper around expo-secure-store for storing sensitive data
 * in the platform keychain (iOS) or keystore (Android).
 */
export const SecureStorage = {
  async get(key: string): Promise<string | null> {
    return SecureStoreModule.getItemAsync(key);
  },

  async set(key: string, value: string): Promise<void> {
    await SecureStoreModule.setItemAsync(key, value);
  },

  async delete(key: string): Promise<void> {
    await SecureStoreModule.deleteItemAsync(key);
  },
};
