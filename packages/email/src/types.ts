import type { Locale } from "@openhospi/i18n";
import type shared from "@openhospi/i18n/messages/nl/shared.json";

export type EmailMessages = typeof shared;

export type BaseEmailProps = {
  locale: Locale;
  baseUrl: string;
  messages: EmailMessages;
};
