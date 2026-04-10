import React, { createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';
import { DarkTheme, DefaultTheme, type Theme as NavigationTheme } from '@react-navigation/native';

import { type Colors, darkColors, lightColors } from './tokens/colors';
import { radius, type RadiusKey } from './tokens/radius';
import { spacing, type SpacingKey } from './tokens/spacing';
import { typography, type TypographyVariant } from './tokens/typography';

// ── Theme shape ──

export interface Theme {
  colors: Colors;
  spacing: typeof spacing;
  typography: typeof typography;
  radius: typeof radius;
  isDark: boolean;
}

// ── Build theme from color scheme ──

function buildTheme(isDark: boolean): Theme {
  return {
    colors: isDark ? darkColors : lightColors,
    spacing,
    typography,
    radius,
    isDark,
  };
}

// ── React Navigation bridge ──

export function getNavigationTheme(isDark: boolean): NavigationTheme {
  const colors = isDark ? darkColors : lightColors;
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

// ── Context ──

const ThemeContext = createContext<Theme | null>(null);

/**
 * Provides the theme to the entire app.
 * Reads the system color scheme and builds light/dark theme accordingly.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = buildTheme(isDark);

  return React.createElement(ThemeContext.Provider, { value: theme }, children);
}

/**
 * Access the current theme (colors, spacing, typography, radius, isDark).
 * Must be used within a ThemeProvider.
 */
export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return theme;
}

// Re-export types for convenience
export type { Colors, SpacingKey, TypographyVariant, RadiusKey };
