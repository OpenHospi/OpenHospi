/**
 * Static, pre-merged i18next resources for the mobile app.
 *
 * Import from `@openhospi/i18n/app` — single source of truth for which JSON
 * files are bundled on mobile (shared + app per locale).
 */
import deApp from "../messages/de/app.json";
import deShared from "../messages/de/shared.json";
import enApp from "../messages/en/app.json";
import enShared from "../messages/en/shared.json";
import nlApp from "../messages/nl/app.json";
import nlShared from "../messages/nl/shared.json";

export const defaultNS = "translation" as const;

export const resources = {
  nl: { translation: { ...nlShared, ...nlApp } },
  en: { translation: { ...enShared, ...enApp } },
  de: { translation: { ...deShared, ...deApp } },
} as const;
