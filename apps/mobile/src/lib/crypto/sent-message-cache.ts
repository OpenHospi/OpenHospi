/**
 * Sent message plaintext cache for mobile.
 * Signal protocol: sender stores plaintext locally, never decrypts own messages.
 */
import { SecureStorage } from './secure-storage';

const KEY_PREFIX = 'sentMsg:';

export const sentMessageCache = {
  async save(messageId: string, plaintext: string): Promise<void> {
    await SecureStorage.set(`${KEY_PREFIX}${messageId}`, plaintext);
  },

  async get(messageId: string): Promise<string | null> {
    return SecureStorage.get(`${KEY_PREFIX}${messageId}`);
  },
};
