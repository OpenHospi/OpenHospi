import type { Locale } from "@openhospi/i18n";
import { getMessages } from "@openhospi/i18n/email";
import { createTranslator } from "next-intl";
import { createElement } from "react";
import { pretty, render, toPlainText } from "react-email";

import { ApplicationAccepted } from "../emails/application-accepted";
import { ApplicationNotChosen } from "../emails/application-not-chosen";
import { EventCancelled } from "../emails/event-cancelled";
import { EventInvitation } from "../emails/event-invitation";
import { EventReminder } from "../emails/event-reminder";
import { ListingRemoved } from "../emails/listing-removed";
import { RsvpReceived } from "../emails/rsvp-received";
import { UserBanned } from "../emails/user-banned";
import { VerificationCode } from "../emails/verification-code";

export type EmailTemplateName =
  | "verificationCode"
  | "eventInvitation"
  | "eventReminder"
  | "eventCancelled"
  | "rsvpReceived"
  | "applicationAccepted"
  | "applicationNotChosen"
  | "userBanned"
  | "listingRemoved";

export type TemplatePropsMap = {
  verificationCode: { code: string };
  eventInvitation: { eventTitle: string; roomTitle: string; eventUrl: string };
  eventReminder: { eventTitle: string; time: string; eventUrl: string };
  eventCancelled: { eventTitle: string };
  rsvpReceived: { name: string; status: string; eventUrl: string };
  applicationAccepted: { roomTitle: string; roomUrl: string };
  applicationNotChosen: { roomTitle: string };
  userBanned: { reason: string };
  listingRemoved: { reason: string };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TEMPLATE_COMPONENTS: Record<EmailTemplateName, React.ComponentType<any>> = {
  verificationCode: VerificationCode,
  eventInvitation: EventInvitation,
  eventReminder: EventReminder,
  eventCancelled: EventCancelled,
  rsvpReceived: RsvpReceived,
  applicationAccepted: ApplicationAccepted,
  applicationNotChosen: ApplicationNotChosen,
  userBanned: UserBanned,
  listingRemoved: ListingRemoved,
};

export async function renderEmail<T extends EmailTemplateName>(
  template: T,
  props: TemplatePropsMap[T],
  locale: Locale,
  baseUrl: string,
): Promise<{ html: string; text: string; subject: string }> {
  const messages = await getMessages(locale);
  // Every template namespace shares the `{ subject, ... }` shape — narrowing
  // to one representative lets the ICU-typed translator type-check uniformly.
  const t = createTranslator({
    locale,
    messages,
    namespace: template as "verificationCode",
  });
  const subject = t("subject", props as Record<string, string>);

  const Component = TEMPLATE_COMPONENTS[template];
  const element = createElement(Component, { ...props, locale, baseUrl });

  const html = await pretty(await render(element));
  const text = toPlainText(html);

  return { html, text, subject };
}
