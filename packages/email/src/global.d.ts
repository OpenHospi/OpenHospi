import type shared from "@openhospi/i18n/messages/nl/shared.json";

declare module "next-intl" {
    interface AppConfig {
        Messages: typeof shared;
    }
}
