import { Platform, type ViewStyle } from 'react-native';

/**
 * Platform-native shadow/elevation styles.
 * iOS: shadow* properties for smooth diffused shadows.
 * Android: elevation for Material depth.
 */
export function shadow(level: 'none' | 'sm' | 'md' | 'lg'): ViewStyle {
  if (level === 'none') return {};

  if (Platform.OS === 'android') {
    const elevationMap = { sm: 2, md: 4, lg: 8 } as const;
    return { elevation: elevationMap[level] };
  }

  const config = {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 6,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.16,
      shadowRadius: 12,
    },
  } as const;

  return config[level];
}
