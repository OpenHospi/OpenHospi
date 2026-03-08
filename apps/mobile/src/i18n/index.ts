import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import i18n, { changeLanguage } from 'i18next';
import ICU from 'i18next-icu';
import { initReactI18next } from 'react-i18next';

import { SUPPORTED_LOCALES, DEFAULT_LOCALE, type Locale } from '@openhospi/i18n';
import { defaultNS, resources } from '@openhospi/i18n/app';

const LOCALE_STORAGE_KEY = 'user-locale';

function getDeviceLocale(): Locale {
  const deviceLocales = getLocales();
  if (!deviceLocales.length) return DEFAULT_LOCALE;

  const languageCode = deviceLocales[0]?.languageCode;
  if (languageCode && (SUPPORTED_LOCALES as readonly string[]).includes(languageCode)) {
    return languageCode as Locale;
  }

  return DEFAULT_LOCALE;
}

i18n
  .use(ICU)
  .use(initReactI18next)
  .init({
    lng: getDeviceLocale(),
    fallbackLng: DEFAULT_LOCALE,
    supportedLngs: SUPPORTED_LOCALES,
    defaultNS,
    resources,
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });

// Restore persisted locale (overrides device locale if set)
AsyncStorage.getItem(LOCALE_STORAGE_KEY).then((stored) => {
  if (stored && (SUPPORTED_LOCALES as readonly string[]).includes(stored)) {
    changeLanguage(stored);
  }
});

// Persist locale changes
i18n.on('languageChanged', (lng) => {
  AsyncStorage.setItem(LOCALE_STORAGE_KEY, lng);
});

export default i18n;
