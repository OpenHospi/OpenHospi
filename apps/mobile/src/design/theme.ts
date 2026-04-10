import React, { createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from '@react-navigation/native';

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

// ── Build themes ──

function buildTheme(isDark: boolean): Theme {
  return {
    colors: isDark ? darkColors : lightColors,
    spacing,
    typography,
    radius,
    isDark,
  };
}

function buildNavigationTheme(isDark: boolean) {
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
 * Single theme provider for the entire app.
 * Reads the system color scheme, provides design tokens via useTheme(),
 * and internally wraps React Navigation's ThemeProvider.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = buildTheme(isDark);
  const navigationTheme = buildNavigationTheme(isDark);

  return React.createElement(
    ThemeContext.Provider,
    { value: theme },
    React.createElement(NavigationThemeProvider, { value: navigationTheme }, children)
  );
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
