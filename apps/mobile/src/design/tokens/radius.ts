import { Platform } from 'react-native';

/**
 * Platform-specific corner radii.
 * iOS uses slightly larger radii (SF-style rounded rects).
 * Android uses Material You conventions.
 */
export const radius = {
  /** Small chips, badges */
  sm: Platform.select({ ios: 6, android: 4 }) as number,
  /** Inputs, small cards */
  md: Platform.select({ ios: 10, android: 8 }) as number,
  /** Grouped sections, cards */
  lg: Platform.select({ ios: 14, android: 12 }) as number,
  /** Large cards, images */
  xl: Platform.select({ ios: 20, android: 16 }) as number,
  /** Pill-shaped elements */
  full: 9999,
} as const;

export type RadiusKey = keyof typeof radius;
