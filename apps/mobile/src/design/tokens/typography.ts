import type { TextStyle } from 'react-native';

/**
 * iOS-aligned semantic typography scale.
 * Uses system fonts (SF Pro on iOS, Roboto on Android) by default.
 * Sizes and line heights match Apple's Human Interface Guidelines.
 */
export const typography = {
  /** 34pt bold — screen titles that collapse on scroll */
  largeTitle: {
    fontSize: 34,
    fontWeight: '700',
    lineHeight: 41,
    letterSpacing: 0.37,
  } satisfies TextStyle,

  /** 28pt bold — primary headings */
  title1: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    letterSpacing: 0.36,
  } satisfies TextStyle,

  /** 22pt bold — secondary headings */
  title2: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
    letterSpacing: 0.35,
  } satisfies TextStyle,

  /** 20pt semibold — tertiary headings */
  title3: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 25,
    letterSpacing: 0.38,
  } satisfies TextStyle,

  /** 17pt semibold — emphasized body text, list item titles */
  headline: {
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 22,
    letterSpacing: -0.41,
  } satisfies TextStyle,

  /** 17pt regular — primary body text */
  body: {
    fontSize: 17,
    fontWeight: '400',
    lineHeight: 22,
    letterSpacing: -0.41,
  } satisfies TextStyle,

  /** 16pt regular — slightly smaller body text */
  callout: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 21,
    letterSpacing: -0.32,
  } satisfies TextStyle,

  /** 15pt regular — secondary information */
  subheadline: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 20,
    letterSpacing: -0.24,
  } satisfies TextStyle,

  /** 13pt regular — metadata, timestamps */
  footnote: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
    letterSpacing: -0.08,
  } satisfies TextStyle,

  /** 12pt regular — small labels, badges */
  caption1: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  } satisfies TextStyle,

  /** 11pt regular — smallest text */
  caption2: {
    fontSize: 11,
    fontWeight: '400',
    lineHeight: 13,
    letterSpacing: 0.07,
  } satisfies TextStyle,
} as const;

export type TypographyVariant = keyof typeof typography;
