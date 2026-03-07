import * as Sentry from '@sentry/react-native';

export function initSentry() {
  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    sendDefaultPii: false,
    enableAutoSessionTracking: true,
    tracesSampleRate: 0.2,
    attachScreenshot: false,
    attachViewHierarchy: false,
    enabled: !__DEV__,
  });
}

export { Sentry };
