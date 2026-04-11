import type { ConfigContext, ExpoConfig } from 'expo/config';

const IS_PRODUCTION = process.env.APP_VARIANT === 'production';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: IS_PRODUCTION ? 'OpenHospi' : 'OpenHospi (Dev)',
  slug: 'openhospi',
  version: '1.0.0',
  platforms: ['ios', 'android'],
  githubUrl: 'https://github.com/OpenHospi/OpenHospi',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'openhospi',
  userInterfaceStyle: 'automatic',
  backgroundColor: '#FFFFFF',
  primaryColor: '#0D9488',
  description:
    'Find a room or roommate in the Netherlands — free, open-source, and student-verified.',
  locales: {
    nl: './assets/locales/nl.json',
    en: './assets/locales/en.json',
    de: './assets/locales/de.json',
  },
  ios: {
    icon: './assets/openhospi.icon',
    appleTeamId: 'K937444566',
    supportsTablet: true,
    bundleIdentifier: 'nl.openhospi.app',
    associatedDomains: ['applinks:openhospi.nl', 'webcredentials:openhospi.nl'],
    splash: {
      image: './assets/images/splash-icon.png',
      imageWidth: 76,
      backgroundColor: '#FFFFFF',
      dark: {
        image: './assets/images/splash-icon.png',
        imageWidth: 76,
        backgroundColor: '#0D1917',
      },
    },
    infoPlist: {
      ITSAppUsesNonExemptEncryption: true,
      // ITSEncryptionExportComplianceCode: '<your-code-here>',
      CFBundleAllowMixedLocalizations: true,
      CFBundleDevelopmentRegion: 'nl',
      CFBundleLocalizations: ['nl', 'en', 'de'],
      NSCameraUsageDescription:
        'OpenHospi needs access to your camera to take profile and room photos.',
      NSPhotoLibraryUsageDescription:
        'OpenHospi needs access to your photo library to upload profile and room photos.',
    },
    privacyManifests: {
      NSPrivacyTracking: false,
      NSPrivacyTrackingDomains: [],
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
    softwareKeyboardLayoutMode: 'resize',
    permissions: [
      'CAMERA',
      'READ_MEDIA_IMAGES',
      'READ_EXTERNAL_STORAGE',
      'WRITE_EXTERNAL_STORAGE',
      'POST_NOTIFICATIONS',
      'INTERNET',
      'ACCESS_NETWORK_STATE',
      'RECEIVE_BOOT_COMPLETED',
      'VIBRATE',
      'WAKE_LOCK',
    ],
    blockedPermissions: [
      'RECORD_AUDIO',
      'READ_PHONE_STATE',
      'READ_CONTACTS',
      'ACCESS_FINE_LOCATION',
      'ACCESS_COARSE_LOCATION',
      'ACCESS_BACKGROUND_LOCATION',
      'BLUETOOTH',
      'BLUETOOTH_ADMIN',
      'BLUETOOTH_CONNECT',
      'BLUETOOTH_SCAN',
    ],
    adaptiveIcon: {
      backgroundColor: '#0D9488',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    splash: {
      image: './assets/images/splash-icon.png',
      imageWidth: 76,
      backgroundColor: '#FFFFFF',
      dark: {
        image: './assets/images/splash-icon.png',
        imageWidth: 76,
        backgroundColor: '#0D1917',
      },
    },
    intentFilters: [
      {
        action: 'VIEW',
        autoVerify: true,
        data: [
          {
            scheme: 'https',
            host: 'openhospi.nl',
            pathPrefix: '/room/',
          },
        ],
        category: ['BROWSABLE', 'DEFAULT'],
      },
      {
        action: 'VIEW',
        autoVerify: true,
        data: [
          {
            scheme: 'https',
            host: 'openhospi.nl',
            pathPrefix: '/chat/',
          },
        ],
        category: ['BROWSABLE', 'DEFAULT'],
      },
      {
        action: 'VIEW',
        autoVerify: true,
        data: [
          {
            scheme: 'https',
            host: 'openhospi.nl',
            pathPrefix: '/nl/room/',
          },
          {
            scheme: 'https',
            host: 'openhospi.nl',
            pathPrefix: '/en/room/',
          },
          {
            scheme: 'https',
            host: 'openhospi.nl',
            pathPrefix: '/de/room/',
          },
        ],
        category: ['BROWSABLE', 'DEFAULT'],
      },
      {
        action: 'VIEW',
        autoVerify: true,
        data: [
          {
            scheme: 'https',
            host: 'openhospi.nl',
            pathPrefix: '/nl/chat/',
          },
          {
            scheme: 'https',
            host: 'openhospi.nl',
            pathPrefix: '/en/chat/',
          },
          {
            scheme: 'https',
            host: 'openhospi.nl',
            pathPrefix: '/de/chat/',
          },
        ],
        category: ['BROWSABLE', 'DEFAULT'],
      },
      {
        action: 'VIEW',
        autoVerify: true,
        data: [
          {
            scheme: 'https',
            host: 'openhospi.nl',
            pathPrefix: '/join/',
          },
          {
            scheme: 'https',
            host: 'openhospi.nl',
            pathPrefix: '/nl/join/',
          },
          {
            scheme: 'https',
            host: 'openhospi.nl',
            pathPrefix: '/en/join/',
          },
          {
            scheme: 'https',
            host: 'openhospi.nl',
            pathPrefix: '/de/join/',
          },
        ],
        category: ['BROWSABLE', 'DEFAULT'],
      },
      {
        action: 'VIEW',
        autoVerify: true,
        data: [
          {
            scheme: 'https',
            host: 'openhospi.nl',
            pathPrefix: '/rooms/',
          },
          {
            scheme: 'https',
            host: 'openhospi.nl',
            pathPrefix: '/nl/rooms/',
          },
          {
            scheme: 'https',
            host: 'openhospi.nl',
            pathPrefix: '/en/rooms/',
          },
          {
            scheme: 'https',
            host: 'openhospi.nl',
            pathPrefix: '/de/rooms/',
          },
        ],
        category: ['BROWSABLE', 'DEFAULT'],
      },
    ],
  },
  androidStatusBar: {
    barStyle: 'dark-content',
  },
  plugins: [
    'expo-router',
    'expo-maps',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#FFFFFF',
        image: './assets/images/splash-icon.png',
        imageWidth: 76,
        dark: {
          backgroundColor: '#0D1917',
          image: './assets/images/splash-icon.png',
          imageWidth: 76,
        },
      },
    ],
    'expo-image',
    'expo-sqlite',
    'expo-secure-store',
    'expo-localization',
    'expo-web-browser',
    '@react-native-community/datetimepicker',
    'expo-sharing',
    [
      'expo-notifications',
      {
        color: '#0D9488',
        icon: './assets/images/android-icon-monochrome.png',
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission:
          'Allow OpenHospi to access your photos to upload profile and room images.',
        cameraPermission: 'Allow OpenHospi to access your camera to take profile and room photos.',
      },
    ],
    [
      'expo-camera',
      {
        cameraPermission:
          'OpenHospi needs camera access to scan QR codes for identity verification.',
      },
    ],
    [
      'expo-build-properties',
      {
        android: {
          compileSdkVersion: 36,
          targetSdkVersion: 35,
          enableProguardInReleaseBuilds: true,
        },
        ios: {
          deploymentTarget: '16.1',
        },
      },
    ],
    [
      'expo-calendar',
      {
        calendarPermission: 'OpenHospi needs access to your calendar to add house events.',
      },
    ],
    'react-native-quick-crypto',
    [
      '@sentry/react-native/expo',
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
    policy: 'fingerprint' as const,
  },
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  owner: 'stichting-openhospi',
  extra: {
    eas: {
      projectId: '6e5a9f1e-1994-424a-a0a6-5f010b59f1b3',
    },
  },
});
