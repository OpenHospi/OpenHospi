import { DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';

export const THEME = {
  light: {
    background: 'hsl(180 20% 98%)',
    foreground: 'hsl(180 30% 12%)',
    card: 'hsl(0 0% 100%)',
    cardForeground: 'hsl(180 30% 12%)',
    primary: 'hsl(174 62% 41%)',
    primaryForeground: 'hsl(180 20% 98%)',
    secondary: 'hsl(180 25% 92%)',
    secondaryForeground: 'hsl(180 25% 17%)',
    muted: 'hsl(180 15% 94%)',
    mutedForeground: 'hsl(180 15% 40%)',
    accent: 'hsl(180 25% 92%)',
    accentForeground: 'hsl(180 25% 17%)',
    destructive: 'hsl(0 84% 60%)',
    border: 'hsl(180 15% 88%)',
    input: 'hsl(180 15% 88%)',
    ring: 'hsl(174 62% 41%)',
  },
  dark: {
    background: 'hsl(180 30% 7%)',
    foreground: 'hsl(180 15% 92%)',
    card: 'hsl(180 25% 12%)',
    cardForeground: 'hsl(180 15% 92%)',
    primary: 'hsl(174 55% 50%)',
    primaryForeground: 'hsl(180 30% 7%)',
    secondary: 'hsl(180 20% 17%)',
    secondaryForeground: 'hsl(180 15% 92%)',
    muted: 'hsl(180 20% 17%)',
    mutedForeground: 'hsl(180 15% 55%)',
    accent: 'hsl(180 20% 17%)',
    accentForeground: 'hsl(180 15% 92%)',
    destructive: 'hsl(0 71% 59%)',
    border: 'hsl(180 10% 20%)',
    input: 'hsl(180 10% 22%)',
    ring: 'hsl(174 55% 50%)',
  },
};

export const NAV_THEME: Record<'light' | 'dark', Theme> = {
  light: {
    ...DefaultTheme,
    colors: {
      background: THEME.light.background,
      border: THEME.light.border,
      card: THEME.light.card,
      notification: THEME.light.destructive,
      primary: THEME.light.primary,
      text: THEME.light.foreground,
    },
  },
  dark: {
    ...DarkTheme,
    colors: {
      background: THEME.dark.background,
      border: THEME.dark.border,
      card: THEME.dark.card,
      notification: THEME.dark.destructive,
      primary: THEME.dark.primary,
      text: THEME.dark.foreground,
    },
  },
};
