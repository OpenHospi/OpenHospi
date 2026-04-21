import type emails from "@openhospi/i18n/messages/nl/emails.json";

declare module "next-intl" {
  interface AppConfig {
    Messages: typeof emails;
  }
}
