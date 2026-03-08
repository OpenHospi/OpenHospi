import { createAuthClient } from 'better-auth/react';
import { genericOAuthClient, multiSessionClient, jwtClient } from 'better-auth/client/plugins';
import { expoClient } from '@better-auth/expo/client';
import * as SecureStore from 'expo-secure-store';

import { API_BASE_URL, APP_SCHEME, STORAGE_PREFIX } from '@/lib/constants';

export const authClient = createAuthClient({
  baseURL: API_BASE_URL,
  plugins: [
    genericOAuthClient(),
    multiSessionClient(),
    jwtClient(),
    expoClient({
      scheme: APP_SCHEME,
      storagePrefix: STORAGE_PREFIX,
      storage: SecureStore,
    }),
  ],
});

export const { useSession, signIn, signOut } = authClient;
