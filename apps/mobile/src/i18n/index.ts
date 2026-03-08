import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import ICU from 'i18next-icu';
import { initReactI18next } from 'react-i18next';

import { SUPPORTED_LOCALES, DEFAULT_LOCALE, type Locale } from '@openhospi/i18n';
import { defaultNS, resources } from '@openhospi/i18n/app';
import { LOCALE_STORAGE_KEY } from '@/lib/constants';

function getDeviceLocale(): Locale {
  const deviceLocales = getLocales();
  if (!deviceLocales.length) return DEFAULT_LOCALE;

  const languageCode = deviceLocales[0]?.languageCode;
  if (languageCode && (SUPPORTED_LOCALES as readonly string[]).includes(languageCode)) {
    return languageCode as Locale;
  }

  return DEFAULT_LOCALE;
}

// Resolve the initial locale before calling i18n.init() to avoid a race condition
async function initI18n() {
  const stored = await AsyncStorage.getItem(LOCALE_STORAGE_KEY).catch(() => null);

  const initialLocale =
    stored && (SUPPORTED_LOCALES as readonly string[]).includes(stored)
      ? (stored as Locale)
      : getDeviceLocale();

  await i18n
    .use(ICU)
    .use(initReactI18next)
    .init({
      lng: initialLocale,
      fallbackLng: DEFAULT_LOCALE,
      supportedLngs: [...SUPPORTED_LOCALES],
      defaultNS,
      resources,
      interpolation: { escapeValue: false },
      react: { useSuspense: false },
    });

  // Persist locale changes going forward
  i18n.on('languageChanged', (lng) => {
    AsyncStorage.setItem(LOCALE_STORAGE_KEY, lng);
  });
}

export const i18nReady = initI18n();

export default i18n;
