import { Platform } from 'react-native';

export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';

/**
 * Type-safe Platform.select that always returns a value (never undefined).
 */
export function platformSelect<T>(options: { ios: T; android: T }): T {
  return Platform.select(options) as T;
}
