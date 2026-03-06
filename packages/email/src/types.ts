import type shared from "@openhospi/i18n/messages/nl/shared.json";
import type { SupportedLocale } from "@openhospi/shared/constants";

export type EmailMessages = typeof shared;

export type BaseEmailProps = {
  locale: SupportedLocale;
  baseUrl: string;
  messages: EmailMessages;
};
