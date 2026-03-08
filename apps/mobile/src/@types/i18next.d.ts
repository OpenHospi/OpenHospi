import type { defaultNS } from '@openhospi/i18n/app';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: typeof defaultNS;
  }
}
