import * as SecureStore from 'expo-secure-store';
import { createAuthClient } from 'better-auth/react';
import { genericOAuthClient, multiSessionClient, jwtClient } from 'better-auth/client/plugins';
import { expoClient } from '@better-auth/expo/client';

import { API_BASE_URL, APP_SCHEME, STORAGE_PREFIX } from '@/lib/constants';

export const BEARER_TOKEN_KEY = `${STORAGE_PREFIX}_bearer_token`;

export const authClient = createAuthClient({
  baseURL: API_BASE_URL,
  fetchOptions: {
    onSuccess: (ctx) => {
      const authToken = ctx.response.headers.get('set-auth-token');
      if (authToken) {
        SecureStore.setItemAsync(BEARER_TOKEN_KEY, authToken);
      }
    },
  },
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
