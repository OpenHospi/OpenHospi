import { useMaterial3Theme, isDynamicThemeSupported } from '@pchmn/expo-material3-theme';

import { isMaterialYouAvailable } from '@/lib/platform-capabilities';

import type { Colors } from './colors';

/**
 * Soft Teal fallback seeds Material 3 scheme generation on devices without
 * wallpaper-derived color (Android <12) or with dynamic color disabled in Settings.
 * Matches `lightColors.primary`.
 */
const FALLBACK_SOURCE_COLOR = '#0d9488';

/**
 * Returns a partial `Colors` overlay derived from Material You wallpaper colors (Android 12+),
 * or `null` when dynamic color is disabled / unavailable.
 *
 * Only overlays `primary`, `accent`, `ring`, and brand foreground tokens.
 * Never overlays `destructive`, `success`, or `warning` — those stay fixed.
 */
export function useDynamicOverlay(enabled: boolean, isDark: boolean): Partial<Colors> | null {
  const { theme } = useMaterial3Theme({ fallbackSourceColor: FALLBACK_SOURCE_COLOR });

  if (!enabled || !isMaterialYouAvailable() || !isDynamicThemeSupported) {
    return null;
  }

  const scheme = isDark ? theme.dark : theme.light;

  return {
    primary: scheme.primary,
    primaryForeground: scheme.onPrimary,
    accent: scheme.secondaryContainer,
    accentForeground: scheme.onSecondaryContainer,
    ring: scheme.primary,
  };
}
