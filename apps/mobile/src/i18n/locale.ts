import { getLocales } from 'expo-localization';

import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from '@openhospi/shared/constants';

export function getDeviceLocale(): SupportedLocale {
  const deviceLocales = getLocales();
  if (!deviceLocales.length) return DEFAULT_LOCALE;

  const languageCode = deviceLocales[0]?.languageCode;
  if (languageCode && (SUPPORTED_LOCALES as readonly string[]).includes(languageCode)) {
    return languageCode as SupportedLocale;
  }

  return DEFAULT_LOCALE;
}
