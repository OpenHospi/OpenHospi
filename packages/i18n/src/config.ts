export const DEFAULT_LOCALE = "nl" as const;
export const SUPPORTED_LOCALES = ["nl", "en", "de"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const LOCALE_CONFIG: Record<Locale, { label: string; name: string }> = {
  nl: { label: "NL", name: "Nederlands" },
  en: { label: "EN", name: "English" },
  de: { label: "DE", name: "Deutsch" },
};

/** Regex matching any supported locale at the start of a URL path */
// eslint-disable-next-line security/detect-non-literal-regexp -- built from a static const array
export const localePathPattern = new RegExp(`^\\/(${SUPPORTED_LOCALES.join("|")})(\/|$)`);
