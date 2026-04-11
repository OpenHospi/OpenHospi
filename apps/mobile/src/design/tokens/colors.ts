/**
 * Semantic color tokens for OpenHospi mobile.
 *
 * Mapped from the oklch Soft Teal palette (previously in global.css).
 * Every color used in the app comes from here — never hardcode hex values.
 */

export interface Colors {
  // ── Background hierarchy (iOS: systemBackground → secondary → tertiary) ──
  background: string;
  secondaryBackground: string;
  tertiaryBackground: string;

  // ── Text hierarchy ──
  foreground: string;
  secondaryForeground: string;
  tertiaryForeground: string;

  // ── Brand ──
  primary: string;
  primaryForeground: string;

  // ── Semantic ──
  destructive: string;
  destructiveForeground: string;
  success: string;
  warning: string;

  // ── Surfaces ──
  card: string;
  cardForeground: string;

  // ── Muted / Accent ──
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;

  // ── Utility ──
  separator: string;
  border: string;
  input: string;
  ring: string;

  // ── Notification ──
  notification: string;
}

export const lightColors: Colors = {
  // Backgrounds
  background: '#f5fafa', // oklch(0.985 0.002 180)
  secondaryBackground: '#eaf4f4', // oklch(0.955 0.01 180) — muted
  tertiaryBackground: '#ffffff', // oklch(1 0 0) — card

  // Text
  foreground: '#134e4a', // oklch(0.205 0.015 180)
  secondaryForeground: '#2c6b66', // oklch(0.25 0.02 180)
  tertiaryForeground: '#5f8a86', // oklch(0.5 0.02 180)

  // Brand
  primary: '#0d9488', // oklch(0.55 0.12 180)
  primaryForeground: '#f5fafa', // oklch(0.985 0.002 180)

  // Semantic
  destructive: '#dc2626', // oklch(0.577 0.245 27.325)
  destructiveForeground: '#ffffff',
  success: '#16a34a', // oklch(0.6 0.15 145)
  warning: '#d97706', // oklch(0.75 0.15 80)

  // Surfaces
  card: '#ffffff', // oklch(1 0 0)
  cardForeground: '#134e4a', // oklch(0.205 0.015 180)

  // Muted / Accent
  muted: '#eaf4f4', // oklch(0.955 0.01 180)
  mutedForeground: '#5f8a86', // oklch(0.5 0.02 180)
  accent: '#dff0f0', // oklch(0.94 0.02 180)
  accentForeground: '#2c6b66', // oklch(0.25 0.02 180)

  // Utility
  separator: '#d9ecec', // oklch(0.9 0.01 180)
  border: '#d9ecec', // oklch(0.9 0.01 180)
  input: '#d9ecec', // oklch(0.9 0.01 180)
  ring: '#0d9488', // oklch(0.55 0.12 180)

  // Notification
  notification: '#dc2626',
};

export const darkColors: Colors = {
  // Backgrounds
  background: '#0f2b2b', // oklch(0.145 0.015 180)
  secondaryBackground: '#183e3e', // oklch(0.25 0.02 180)
  tertiaryBackground: '#1a3d3d', // oklch(0.195 0.015 180) — card

  // Text
  foreground: '#e2f0f0', // oklch(0.94 0.01 180)
  secondaryForeground: '#e2f0f0', // oklch(0.94 0.01 180)
  tertiaryForeground: '#7aada8', // oklch(0.65 0.03 180)

  // Brand
  primary: '#2dd4bf', // oklch(0.65 0.13 180)
  primaryForeground: '#0f2b2b', // oklch(0.145 0.015 180)

  // Semantic
  destructive: '#ef4444', // oklch(0.704 0.191 22.216)
  destructiveForeground: '#ffffff',
  success: '#22c55e', // oklch(0.65 0.15 145)
  warning: '#eab308', // oklch(0.8 0.15 80)

  // Surfaces
  card: '#1a3d3d', // oklch(0.195 0.015 180)
  cardForeground: '#e2f0f0', // oklch(0.94 0.01 180)

  // Muted / Accent
  muted: '#183e3e', // oklch(0.25 0.02 180)
  mutedForeground: '#7aada8', // oklch(0.65 0.03 180)
  accent: '#183e3e', // oklch(0.25 0.02 180)
  accentForeground: '#e2f0f0', // oklch(0.94 0.01 180)

  // Utility
  separator: 'rgba(255,255,255,0.1)', // oklch(1 0 0 / 10%)
  border: 'rgba(255,255,255,0.1)', // oklch(1 0 0 / 10%)
  input: 'rgba(255,255,255,0.15)', // oklch(1 0 0 / 15%)
  ring: '#2dd4bf', // oklch(0.65 0.13 180)

  // Notification
  notification: '#ef4444',
};
