import type { SUPPORTED_LOCALES } from "@openhospi/shared/constants";

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export async function getMessages(locale: Locale) {
  switch (locale) {
    case "en":
      return (await import("../messages/en.json")).default;
    case "de":
      return (await import("../messages/de.json")).default;
    default:
      return (await import("../messages/nl.json")).default;
  }
}
