import { defineRouting } from "next-intl/routing";
import {
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
} from "@openhospi/shared/constants";

export const routing = defineRouting({
  locales: SUPPORTED_LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: "always",
});
