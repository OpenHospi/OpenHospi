import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from "@openhospi/shared/constants";
import { defineRouting } from "next-intl/routing";

export const marketingRouting = defineRouting({
  locales: SUPPORTED_LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: "always",
});

export const appRouting = defineRouting({
  locales: SUPPORTED_LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: "never",
});

export const routing = marketingRouting;
