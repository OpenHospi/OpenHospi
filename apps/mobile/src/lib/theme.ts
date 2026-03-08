import { DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';

/**
 * Hex equivalents of the Soft Teal oklch palette from global.css.
 * React Navigation requires hex/rgb strings for its theme colors.
 */
export const NAV_THEME: Record<'light' | 'dark', Theme> = {
  light: {
    ...DefaultTheme,
    colors: {
      background: '#f5fafa', // oklch(0.985 0.002 180)
      border: '#d9ecec', // oklch(0.9 0.01 180)
      card: '#ffffff', // oklch(1 0 0)
      notification: '#dc2626', // oklch(0.577 0.245 27.325)
      primary: '#0d9488', // oklch(0.55 0.12 180)
      text: '#134e4a', // oklch(0.205 0.015 180)
    },
  },
  dark: {
    ...DarkTheme,
    colors: {
      background: '#0f2b2b', // oklch(0.145 0.015 180)
      border: 'rgba(255,255,255,0.1)', // oklch(1 0 0 / 10%)
      card: '#1a3d3d', // oklch(0.195 0.015 180)
      notification: '#ef4444', // oklch(0.704 0.191 22.216)
      primary: '#2dd4bf', // oklch(0.65 0.13 180)
      text: '#e2f0f0', // oklch(0.94 0.01 180)
    },
  },
};
