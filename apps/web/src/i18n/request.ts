import type { Locale } from "@openhospi/i18n";
import { getMessages } from "@openhospi/i18n/web";
import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";

import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  return {
    locale,
    messages: await getMessages(locale as Locale),
  };
});
