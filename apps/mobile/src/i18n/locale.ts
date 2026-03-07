import { getLocales } from 'expo-localization';

import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type Locale } from '@openhospi/i18n';

export function getDeviceLocale(): Locale {
  const deviceLocales = getLocales();
  if (!deviceLocales.length) return DEFAULT_LOCALE;

  const languageCode = deviceLocales[0]?.languageCode;
  if (languageCode && (SUPPORTED_LOCALES as readonly string[]).includes(languageCode)) {
    return languageCode as Locale;
  }

  return DEFAULT_LOCALE;
}
