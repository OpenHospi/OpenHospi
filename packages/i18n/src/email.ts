import deEmails from "../messages/de/emails.json";
import enEmails from "../messages/en/emails.json";
import nlEmails from "../messages/nl/emails.json";

import type { Locale } from "./config";
import type { EmailMessages } from "./types";

const bundles: Record<Locale, EmailMessages> = {
  nl: nlEmails as EmailMessages,
  en: enEmails as EmailMessages,
  de: deEmails as EmailMessages,
};

export async function getMessages(locale: Locale): Promise<EmailMessages> {
  return bundles[locale];
}
