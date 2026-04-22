import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from '@react-navigation/native';

import { mmkv } from '@/lib/mmkv';

import { type Colors, darkColors, lightColors } from './tokens/colors';
import { useDynamicOverlay } from './tokens/dynamic-color';
import { darkGlass, type GlassTokens, lightGlass } from './tokens/glass';
import { radius, type RadiusKey } from './tokens/radius';
import { spacing, type SpacingKey } from './tokens/spacing';
import { typography, type TypographyVariant } from './tokens/typography';

// ── Preferences ──

export type ColorSchemePreference = 'light' | 'dark' | 'system';

const COLOR_SCHEME_KEY = 'theme.colorSchemePreference';
const DYNAMIC_COLOR_KEY = 'theme.useDynamicColor';

// ── Theme shape ──

export interface Theme {
  colors: Colors;
  glass: GlassTokens;
  spacing: typeof spacing;
  typography: typeof typography;
  radius: typeof radius;
  isDark: boolean;
  colorSchemePreference: ColorSchemePreference;
  setColorSchemePreference: (pref: ColorSchemePreference) => void;
  useDynamicColor: boolean;
  setUseDynamicColor: (enabled: boolean) => void;
}

function buildNavigationTheme(isDark: boolean, colors: Colors) {
  const base = isDark ? DarkTheme : DefaultTheme;
  return {
    ...base,
    colors: {
      ...base.colors,
      background: colors.background,
      border: colors.border,
      card: colors.card,
      notification: colors.notification,
      primary: colors.primary,
      text: colors.foreground,
    },
  };
}

function resolveInitialPreference(): ColorSchemePreference {
  const stored = mmkv.getString(COLOR_SCHEME_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  return 'system';
}

function resolveInitialDynamicColor(): boolean {
  const stored = mmkv.getBoolean(DYNAMIC_COLOR_KEY);
  return stored ?? true;
}

// ── Context ──

const ThemeContext = createContext<Theme | null>(null);

/**
 * Single theme provider for the entire app.
 *
 * - Resolves effective color scheme from the user preference (MMKV) and the system scheme.
 * - Applies a Material You dynamic-color overlay on Android 12+ when enabled.
 * - Exposes design tokens via `useTheme()` and wraps React Navigation's ThemeProvider.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();

  const [colorSchemePreference, setColorSchemePreferenceState] =
    useState<ColorSchemePreference>(resolveInitialPreference);
  const [useDynamicColor, setUseDynamicColorState] = useState<boolean>(resolveInitialDynamicColor);

  const isDark =
    colorSchemePreference === 'system' ? systemScheme === 'dark' : colorSchemePreference === 'dark';

  const dynamicOverlay = useDynamicOverlay(useDynamicColor, isDark);

  const setColorSchemePreference = useCallback((pref: ColorSchemePreference) => {
    setColorSchemePreferenceState(pref);
    mmkv.setString(COLOR_SCHEME_KEY, pref);
  }, []);

  const setUseDynamicColor = useCallback((enabled: boolean) => {
    setUseDynamicColorState(enabled);
    mmkv.setBoolean(DYNAMIC_COLOR_KEY, enabled);
  }, []);

  const theme = useMemo<Theme>(() => {
    const baseColors = isDark ? darkColors : lightColors;
    const colors: Colors = dynamicOverlay ? { ...baseColors, ...dynamicOverlay } : baseColors;
    return {
      colors,
      glass: isDark ? darkGlass : lightGlass,
      spacing,
      typography,
      radius,
      isDark,
      colorSchemePreference,
      setColorSchemePreference,
      useDynamicColor,
      setUseDynamicColor,
    };
  }, [
    isDark,
    dynamicOverlay,
    colorSchemePreference,
    setColorSchemePreference,
    useDynamicColor,
    setUseDynamicColor,
  ]);

  const navigationTheme = useMemo(
    () => buildNavigationTheme(isDark, theme.colors),
    [isDark, theme.colors]
  );

  return (
    <ThemeContext.Provider value={theme}>
      <NavigationThemeProvider value={navigationTheme}>{children}</NavigationThemeProvider>
    </ThemeContext.Provider>
  );
}

/**
 * Access the current theme (colors, glass, spacing, typography, radius, isDark, preferences).
 * Must be used within a ThemeProvider.
 */
export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return theme;
}

export type { Colors, SpacingKey, TypographyVariant, RadiusKey, GlassTokens };
