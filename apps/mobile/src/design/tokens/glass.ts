/**
 * Glass surface tokens for iOS 26 Liquid Glass and pre-26 blur fallback.
 *
 * iOS 26+ renders SwiftUI `.glassEffect(...)` via `expo-glass-effect`.
 * iOS 16.1–25 falls back to `expo-blur` BlurView with the tokens below.
 * Android falls back to a hairline-bordered solid surface (see PlatformSurface).
 */

export type GlassVariant = 'regular' | 'prominent' | 'thin';

export interface GlassTokens {
  /** BlurView intensity on iOS 16.1–25 fallback. 0-100. */
  fallbackIntensity: Record<GlassVariant, number>;
  /** Overlay opacity laid over BlurView to lift chroma in the fallback path. */
  overlayOpacity: Record<GlassVariant, number>;
  /** Hairline border color when rendered on top of glass. */
  borderOnGlass: string;
  /** Primary brand color tuned for legibility on glass surfaces. */
  primaryOnGlass: string;
  /** Foreground text color tuned for legibility on glass surfaces. */
  foregroundOnGlass: string;
  /** Separator color inside a glass surface. */
  separatorOnGlass: string;
}

export const lightGlass: GlassTokens = {
  fallbackIntensity: { regular: 60, prominent: 85, thin: 35 },
  overlayOpacity: { regular: 0.35, prominent: 0.55, thin: 0.2 },
  borderOnGlass: 'rgba(19, 78, 74, 0.12)',
  primaryOnGlass: '#0d9488',
  foregroundOnGlass: '#134e4a',
  separatorOnGlass: 'rgba(19, 78, 74, 0.08)',
};

export const darkGlass: GlassTokens = {
  fallbackIntensity: { regular: 70, prominent: 90, thin: 40 },
  overlayOpacity: { regular: 0.4, prominent: 0.6, thin: 0.22 },
  borderOnGlass: 'rgba(255, 255, 255, 0.14)',
  primaryOnGlass: '#2dd4bf',
  foregroundOnGlass: '#e2f0f0',
  separatorOnGlass: 'rgba(255, 255, 255, 0.1)',
};
