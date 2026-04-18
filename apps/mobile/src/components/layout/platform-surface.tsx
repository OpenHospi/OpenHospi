import { type AccessibilityRole, Platform, StyleSheet, View, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { GlassView, type GlassStyle } from 'expo-glass-effect';

import { shadow } from '@/design/tokens/shadows';
import { useTheme } from '@/design/theme';
import { isGlassEffectAPIAvailable } from '@/lib/platform-capabilities';

export type SurfaceVariant = 'chrome' | 'card' | 'grouped' | 'modal';
export type SurfaceEdge = 'top' | 'bottom' | 'none';
export type SurfaceGlass = 'regular' | 'prominent' | 'thin';

export interface PlatformSurfaceProps {
  variant: SurfaceVariant;
  /** Only meaningful for `chrome`. Adds a hairline on the interior edge facing content. */
  edge?: SurfaceEdge;
  /** iOS 26 only; controls `GlassView.glassEffectStyle` and fallback BlurView intensity. */
  glass?: SurfaceGlass;
  children: React.ReactNode;
  style?: ViewStyle;
  accessibilityRole?: AccessibilityRole;
}

const GLASS_STYLE_MAP: Record<SurfaceGlass, GlassStyle> = {
  regular: 'regular',
  prominent: 'regular',
  thin: 'clear',
};

/**
 * Unified platform-aware surface for chrome, cards, grouped sections, and modal backgrounds.
 *
 * iOS 26+ chrome uses `GlassView` (Liquid Glass). iOS 16.1–25 falls back to `BlurView`.
 * Android always renders a solid Material surface with hairline + elevation for chrome,
 * and theme-colored background for cards/grouped/modal.
 */
export function PlatformSurface({
  variant,
  edge = 'none',
  glass = 'regular',
  children,
  style,
  accessibilityRole,
}: PlatformSurfaceProps) {
  const theme = useTheme();
  const { colors, glass: glassTokens, radius } = theme;

  if (variant === 'chrome') {
    const edgeStyle: ViewStyle =
      edge === 'top'
        ? { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.separator }
        : edge === 'bottom'
          ? { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.separator }
          : {};

    if (Platform.OS === 'ios') {
      if (isGlassEffectAPIAvailable()) {
        return (
          <GlassView
            glassEffectStyle={GLASS_STYLE_MAP[glass]}
            colorScheme="auto"
            style={[edgeStyle, style]}
            accessibilityRole={accessibilityRole}>
            {children}
          </GlassView>
        );
      }

      return (
        <BlurView
          intensity={glassTokens.fallbackIntensity[glass]}
          tint={theme.isDark ? 'dark' : 'light'}
          style={[edgeStyle, style]}
          accessibilityRole={accessibilityRole}>
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: colors.background,
                opacity: glassTokens.overlayOpacity[glass],
              },
            ]}
          />
          {children}
        </BlurView>
      );
    }

    // Android: solid chrome + hairline + elevation
    return (
      <View
        style={[{ backgroundColor: colors.background }, shadow('sm'), edgeStyle, style]}
        accessibilityRole={accessibilityRole}>
        {children}
      </View>
    );
  }

  if (variant === 'card') {
    return (
      <View
        style={[
          {
            backgroundColor: colors.card,
            borderRadius: radius.lg,
          },
          shadow(Platform.OS === 'ios' ? 'sm' : 'md'),
          style,
        ]}
        accessibilityRole={accessibilityRole}>
        {children}
      </View>
    );
  }

  if (variant === 'grouped') {
    return (
      <View
        style={[
          {
            backgroundColor: colors.secondaryBackground,
            borderRadius: radius.lg,
          },
          style,
        ]}
        accessibilityRole={accessibilityRole}>
        {children}
      </View>
    );
  }

  // modal
  return (
    <View
      style={[{ backgroundColor: colors.background }, style]}
      accessibilityRole={accessibilityRole}>
      {children}
    </View>
  );
}
