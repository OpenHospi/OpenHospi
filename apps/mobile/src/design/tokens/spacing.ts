/**
 * Spacing scale for consistent padding, margins, and gaps.
 * Base-4 grid aligned with iOS HIG and Material 3 conventions.
 */
export const spacing = {
  /** 2px — hairline gaps */
  xxs: 2,
  /** 4px — tight internal padding */
  xs: 4,
  /** 8px — compact spacing */
  sm: 8,
  /** 12px — standard internal padding */
  md: 12,
  /** 16px — standard screen margin, section padding */
  lg: 16,
  /** 20px — comfortable spacing */
  xl: 20,
  /** 24px — section gaps */
  '2xl': 24,
  /** 32px — large section separation */
  '3xl': 32,
  /** 40px — generous whitespace */
  '4xl': 40,
  /** 48px — extra-large spacing */
  '5xl': 48,
} as const;

export type SpacingKey = keyof typeof spacing;
