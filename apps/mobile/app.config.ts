import type { ConfigContext, ExpoConfig } from 'expo/config';

const IS_PRODUCTION = process.env.APP_VARIANT === 'production';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'OpenHospi',
  slug: 'openhospi',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'openhospi',
  userInterfaceStyle: 'automatic',
  ios: {
    icon: './assets/openhospi.icon',
    supportsTablet: true,
    bundleIdentifier: 'nl.openhospi.app',
    privacyManifests: {
      NSPrivacyAccessedAPITypes: [
        {
          NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryUserDefaults',
          NSPrivacyAccessedAPITypeReasons: ['CA92.1'],
        },
        {
          NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategorySystemBootTime',
          NSPrivacyAccessedAPITypeReasons: ['35F9.1'],
        },
        {
          NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryFileTimestamp',
          NSPrivacyAccessedAPITypeReasons: ['C617.1'],
        },
      ],
      NSPrivacyCollectedDataTypes: [
        {
          NSPrivacyCollectedDataType: 'NSPrivacyCollectedDataTypeCrashData',
          NSPrivacyCollectedDataTypeLinked: false,
          NSPrivacyCollectedDataTypeTracking: false,
          NSPrivacyCollectedDataTypePurposes: ['NSPrivacyCollectedDataTypePurposeAppFunctionality'],
        },
        {
          NSPrivacyCollectedDataType: 'NSPrivacyCollectedDataTypePerformanceData',
          NSPrivacyCollectedDataTypeLinked: false,
          NSPrivacyCollectedDataTypeTracking: false,
          NSPrivacyCollectedDataTypePurposes: ['NSPrivacyCollectedDataTypePurposeAppFunctionality'],
        },
        {
          NSPrivacyCollectedDataType: 'NSPrivacyCollectedDataTypeOtherDiagnosticData',
          NSPrivacyCollectedDataTypeLinked: false,
          NSPrivacyCollectedDataTypeTracking: false,
          NSPrivacyCollectedDataTypePurposes: ['NSPrivacyCollectedDataTypePurposeAppFunctionality'],
        },
      ],
    },
  },
  android: {
    package: 'nl.openhospi.app',
    adaptiveIcon: {
      backgroundColor: '#0D9488',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#208AEF',
        android: {
          image: './assets/images/splash-icon.png',
          imageWidth: 76,
        },
      },
    ],
    'expo-image',
    'expo-sqlite',
    'expo-secure-store',
    'expo-localization',
    'expo-sharing',
    [
      'expo-notifications',
      {
        color: '#208AEF',
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission:
          'Allow OpenHospi to access your photos to upload profile and room images.',
      },
    ],
    [
      '@sentry/react-native',
      {
        url: 'https://sentry.io/',
        project: 'mobile',
        organization: 'stichting-openhospi',
      },
    ],
  ],
  updates: {
    url: 'https://u.expo.dev/6e5a9f1e-1994-424a-a0a6-5f010b59f1b3',
    enabled: true,
    checkAutomatically: 'ON_LOAD' as const,
    fallbackToCacheTimeout: 0,
  },
  runtimeVersion: {
    policy: 'appVersion' as const,
  },
  experiments: {
    typedRoutes: true,
    autolinkingModuleResolution: true,
  },
  owner: 'openhospi',
  extra: {
    router: {},
    eas: {
      projectId: '6e5a9f1e-1994-424a-a0a6-5f010b59f1b3',
    },
  },
});
