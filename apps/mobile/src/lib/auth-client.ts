import { createAuthClient } from 'better-auth/react';
import { genericOAuthClient, multiSessionClient, jwtClient } from 'better-auth/client/plugins';
import { expoClient } from '@better-auth/expo/client';
import * as SecureStore from 'expo-secure-store';

export const authClient = createAuthClient({
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? 'https://openhospi.nl',
  plugins: [
    genericOAuthClient(),
    multiSessionClient(),
    jwtClient(),
    expoClient({
      scheme: 'openhospi',
      storagePrefix: 'openhospi',
      storage: SecureStore,
    }),
  ],
});

export const { useSession, signIn, signOut } = authClient;
