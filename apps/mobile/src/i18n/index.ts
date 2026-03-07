import { getMessages } from '@openhospi/i18n/app';
import type { AppMessages } from '@openhospi/i18n';
import type { SupportedLocale } from '@openhospi/shared/constants';
import MessageFormat from 'intl-messageformat';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { getDeviceLocale } from './locale';

interface I18nContextValue {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  messages: AppMessages;
}

const I18nContext = createContext<I18nContextValue | null>(null);

// Cache for compiled MessageFormat instances
const formatCache = new Map<string, MessageFormat>();

function getNestedValue(obj: Record<string, unknown>, keyPath: string): string | undefined {
  const keys = keyPath.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[key];
  }

  return typeof current === 'string' ? current : undefined;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<SupportedLocale>(getDeviceLocale());
  const [messages, setMessages] = useState<AppMessages | null>(null);

  useEffect(() => {
    formatCache.clear();
    getMessages(locale).then((msgs) => setMessages(msgs as AppMessages));
  }, [locale]);

  if (!messages) {
    return React.createElement(
      View,
      { style: { flex: 1, justifyContent: 'center', alignItems: 'center' } },
      React.createElement(ActivityIndicator, { size: 'large' }),
    );
  }

  return React.createElement(
    I18nContext.Provider,
    { value: { locale, setLocale, messages } },
    children,
  );
}

export function useLocale(): { locale: SupportedLocale; setLocale: (l: SupportedLocale) => void } {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useLocale must be used within I18nProvider');
  return { locale: ctx.locale, setLocale: ctx.setLocale };
}

export function useTranslations(namespace?: string) {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useTranslations must be used within I18nProvider');

  const { messages, locale } = ctx;

  return useCallback(
    (key: string, values?: Record<string, string | number | boolean>) => {
      const fullKey = namespace ? `${namespace}.${key}` : key;
      const template = getNestedValue(messages as unknown as Record<string, unknown>, fullKey);

      if (template == null) {
        if (__DEV__) console.warn(`[i18n] Missing translation: "${fullKey}"`);
        return fullKey;
      }

      if (!values) return template;

      const cacheKey = `${locale}:${fullKey}`;
      let formatter = formatCache.get(cacheKey);
      if (!formatter) {
        formatter = new MessageFormat(template, locale);
        formatCache.set(cacheKey, formatter);
      }

      return formatter.format(values) as string;
    },
    [messages, locale, namespace],
  );
}
