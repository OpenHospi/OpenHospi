import { Platform } from 'react-native';

export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';

/**
 * Type-safe Platform.select that always returns a value (never undefined).
 * Both ios and android values are required, so the result is always T.
 */
export function platformSelect<T>(options: { ios: T; android: T }): T {
  return Platform.OS === 'ios' ? options.ios : options.android;
}
